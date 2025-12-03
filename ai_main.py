from flask import Flask, render_template, request, jsonify
import os
from openai import OpenAI

app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def home():
    # If you already have a home page, keep your existing route instead
    return render_template("ai_assistant.html")

@app.route("/ai-assistant")
def ai_assistant():
    # Use this if you want the AI page on a sub-URL like /ai-assistant
    return render_template("ai_assistant.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "")

    if not user_message.strip():
        return jsonify({"reply": "Please type a message so I can help you."})

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the Gem AI Cybersecurity Assistant. "
                    "You provide safe, educational cybersecurity guidance in clear steps. "
                    "You do NOT ask for or process passwords, full credit card numbers, "
                    "private keys, or any extremely sensitive data. "
                    "You help users understand threats, phishing, scams, and good practice."
                )
            },
            {"role": "user", "content": user_message}
        ]
    )

    reply = completion.choices[0].message.content
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
