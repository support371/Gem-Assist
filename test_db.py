from app import app, db

class TestConnection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(200))

with app.app_context():
    # Create the table
    db.create_all()

    # Insert a test row
    test_row = TestConnection(message="✅ Flask app successfully wrote to Neon database")
    db.session.add(test_row)
    db.session.commit()

    # Fetch all rows and print them
    rows = TestConnection.query.all()
    for r in rows:
        print(f"{r.id} | {r.message}")
