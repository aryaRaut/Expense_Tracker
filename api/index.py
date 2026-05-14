import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)
# IMPORTANT: This allows your frontend to talk to this backend
CORS(app)

url: str = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("WARNING: Supabase URL or Service Role Key missing.")
    supabase = None
else:
    supabase: Client = create_client(url, key)

def get_user_from_request(req):
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        user_resp = supabase.auth.get_user(token)
        return user_resp.user
    except Exception as e:
        print("Auth error:", e)
        return None

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    if not supabase:
         return jsonify([]), 500
         
    user = get_user_from_request(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        response = supabase.table("expenses").select("*").eq("user_id", user.id).order("date", desc=True).execute()
        expenses = []
        for e in response.data:
            expense_item = {
                "id": str(e.get('id')),
                "date": str(e.get('date'))[:10] if e.get('date') else '',
                "type": e.get('type', 'Expense'),
                "category": e.get('category'),
                "description": e.get('description'),
                "amount": e.get('amount')
            }
            if 'split_details' in e:
                expense_item['split_details'] = e['split_details']
            expenses.append(expense_item)
        return jsonify(expenses)
    except Exception as e:
        print("Error reading from Supabase:", e)
        return jsonify([])

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    if not supabase:
         return jsonify({"error": "DB not configured"}), 500

    user = get_user_from_request(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    amount_val = float(data.get('amount', 0))
    
    expense_doc = {
        "user_id": user.id,
        "date": data.get('date'),
        "type": data.get('type', 'Expense'),
        "category": data.get('category'),
        "description": data.get('description'),
        "amount": amount_val
    }
    
    try:
        response = supabase.table("expenses").insert(expense_doc).execute()
        if len(response.data) > 0:
            e = response.data[0]
            expense_id = e.get('id')
            
            # Handle split_details
            inserted_splits = []
            if 'split_details' in data and data['split_details']:
                split_inserts = []
                for split in data['split_details']:
                    split_inserts.append({
                        "expense_id": expense_id,
                        "user_id": user.id,
                        "name": split.get('name', ''),
                        "amount": split.get('amount', 0),
                        "is_paid": split.get('paid', False)
                    })
                if split_inserts:
                    try:
                        splits_response = supabase.table("split_details").insert(split_inserts).execute()
                        inserted_splits = splits_response.data
                    except Exception as split_err:
                        print("Error inserting splits:", split_err)

            expense_item = {
                "id": str(expense_id),
                "date": str(e.get('date'))[:10] if e.get('date') else '',
                "type": e.get('type', 'Expense'),
                "category": e.get('category'),
                "description": e.get('description'),
                "amount": e.get('amount'),
                "split_details": inserted_splits
            }
            return jsonify(expense_item)
        return jsonify({"error": "Failed to insert"}), 500
    except Exception as e:
         print("Error writing to Supabase:", e)
         return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    if not supabase:
         return jsonify({"error": "DB not configured"}), 500

    user = get_user_from_request(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # We must filter by both id and user_id to prevent users from deleting other users' expenses
        response = supabase.table("expenses").delete().eq("id", expense_id).eq("user_id", user.id).execute()
        # if the array is empty, nothing was deleted
        if len(response.data) > 0:
            return jsonify({"success": True})
        return jsonify({"success": False, "error": "Not found or unauthorized"}), 404
    except Exception as e:
        print("Error deleting from Supabase:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/meta', methods=['GET'])
def get_meta():
    if not supabase:
         return jsonify({"startingBalance": 0})
         
    user = get_user_from_request(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        response = supabase.table("user_meta").select("starting_balance").eq("user_id", user.id).execute()
        if len(response.data) > 0:
            return jsonify({"startingBalance": response.data[0].get("starting_balance", 0)})
        return jsonify({"startingBalance": 0})
    except Exception as e:
        print("Error reading meta data:", e)
        return jsonify({"startingBalance": 0})

@app.route('/api/meta', methods=['POST'])
def update_meta():
    if not supabase:
         return jsonify({"error": "DB not configured"}), 500
         
    user = get_user_from_request(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    balance = float(data.get('startingBalance', 0))
    try:
        # Supabase Python client upsert requires the primary key in the payload.
        doc = {
            "user_id": user.id,
            "starting_balance": balance
        }
        response = supabase.table("user_meta").upsert(doc).execute()
        if len(response.data) > 0:
            return jsonify({"startingBalance": response.data[0].get("starting_balance", 0)})
        return jsonify({"startingBalance": balance})
    except Exception as e:
        print("Error writing meta data:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/splits', methods=['GET'])
def get_splits():
    if not supabase:
         return jsonify([]), 500
         
    user = get_user_from_request(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # Join with expenses table to get date and description
        response = supabase.table("split_details").select("*, expenses(description, date)").eq("user_id", user.id).execute()
        return jsonify(response.data)
    except Exception as e:
        print("Error reading splits:", e)
        return jsonify([])

@app.route('/api/splits/<split_id>', methods=['PUT'])
def update_split(split_id):
    if not supabase:
         return jsonify({"error": "DB not configured"}), 500
         
    user = get_user_from_request(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    is_paid = data.get('is_paid')
    
    if is_paid is None:
        return jsonify({"error": "Missing is_paid"}), 400

    try:
        response = supabase.table("split_details").update({"is_paid": is_paid}).eq("id", split_id).eq("user_id", user.id).execute()
        if len(response.data) > 0:
            return jsonify(response.data[0])
        return jsonify({"error": "Split not found or unauthorized"}), 404
    except Exception as e:
        print("Error updating split:", e)
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
