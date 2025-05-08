from flask import Flask, request, jsonify, make_response
import traceback
from generate_summary import create_summary_data_for_dashboard

app = Flask(__name__)

# --------------------
# CORS HANDLING (all routes)
# --------------------
@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

# --------------------
# Health check
# --------------------
@app.route("/ping", methods=["GET", "OPTIONS"])
def ping():
    if request.method == "OPTIONS":
        return make_response("", 204)
    return jsonify({"status": "ok"}), 200

# --------------------
# Summary endpoint with OPTIONS support
# --------------------
@app.route("/generate-summary", methods=["POST", "OPTIONS"])
def generate_summary():
    # Handle preflight
    if request.method == "OPTIONS":
        return make_response("", 204)

    try:
        data = request.get_json(force=True)
        user_id   = data.get("user_id")
        posts_ids = data.get("posts_ids")
        prompt    = data.get("prompt_type", "specific")

        if not user_id or not posts_ids:
            return jsonify({"error": "Missing required parameters"}), 400

        create_summary_data_for_dashboard(user_id, posts_ids, prompt)
        return jsonify({"message":"Summary generated successfully",
                        "userid": user_id}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # no auto-reload, just production mode
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
