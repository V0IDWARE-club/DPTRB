import os
import unittest
import json

TEST_DB_FILE = "./test_button_panic.db"
if os.path.exists(TEST_DB_FILE):
    os.remove(TEST_DB_FILE)

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

from fastapi.testclient import TestClient
from backend.app.database import Base, engine
from backend.app.main import app


class TestButtonPanicBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(TEST_DB_FILE):
            os.remove(TEST_DB_FILE)

    def setUp(self):
        # Recreate tables fresh for each test
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    def test_health_and_root(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "OPERATIONAL")

        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_active_session_creation(self):
        res = self.client.get("/api/session/active")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        self.assertEqual(data["status"], "registration")
        self.assertEqual(data["player_count"], 0)

    def test_player_registration_and_validation(self):
        # Empty name
        res = self.client.post("/api/players/register", json={"name": "   "})
        self.assertEqual(res.status_code, 400)

        # Successful registration with trimming
        res = self.client.post("/api/players/register", json={"name": "  Cyber_Neo  "})
        self.assertEqual(res.status_code, 201)
        player_data = res.json()
        self.assertEqual(player_data["name"], "Cyber_Neo")
        player_id = player_data["id"]

        # Duplicate registration (same casing) - rejected
        res_dup = self.client.post("/api/players/register", json={"name": "Cyber_Neo"})
        self.assertEqual(res_dup.status_code, 409)

        # Case-sensitive check: different casing (e.g. cyber_neo vs Cyber_Neo) must be ALLOWED as different user
        res_diff_case = self.client.post("/api/players/register", json={"name": "cyber_neo"})
        self.assertEqual(res_diff_case.status_code, 201)
        self.assertEqual(res_diff_case.json()["name"], "cyber_neo")

        # Duplicate of cyber_neo must be rejected
        res_diff_case_dup = self.client.post("/api/players/register", json={"name": "cyber_neo"})
        self.assertEqual(res_diff_case_dup.status_code, 409)

        # Another unique player
        res2 = self.client.post("/api/players/register", json={"name": "Quantum_Ghost"})
        self.assertEqual(res2.status_code, 201)

        # Check registered players list
        res_list = self.client.get("/api/players")
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 3)

    def test_results_and_leaderboard_flow(self):
        # Register 4 players
        p1 = self.client.post("/api/players/register", json={"name": "Player_One"}).json()
        p2 = self.client.post("/api/players/register", json={"name": "Player_Two"}).json()
        p3 = self.client.post("/api/players/register", json={"name": "Player_Three"}).json()
        p4 = self.client.post("/api/players/register", json={"name": "Player_Four"}).json()

        # Submit results
        res_p1 = self.client.post(
            "/api/results",
            json={
                "player_id": p1["id"],
                "final_score": 1400,
                "best_streak": 8,
                "accuracy": 91.5,
                "average_reaction_time": 360.0,
                "remaining_lives": 2,
            },
        )
        self.assertEqual(res_p1.status_code, 200)
        self.assertEqual(res_p1.json()["rank"], 1)

        res_p2 = self.client.post(
            "/api/results",
            json={
                "player_id": p2["id"],
                "final_score": 2850,
                "best_streak": 14,
                "accuracy": 94.2,
                "average_reaction_time": 342.0,
                "remaining_lives": 2,
            },
        )
        self.assertEqual(res_p2.status_code, 200)
        self.assertEqual(res_p2.json()["rank"], 1)  # Player 2 is now rank 1!
        self.assertEqual(res_p2.json()["tier"], "TIER S")

        res_p3 = self.client.post(
            "/api/results",
            json={
                "player_id": p3["id"],
                "final_score": 4120,
                "best_streak": 19,
                "accuracy": 98.0,
                "average_reaction_time": 290.0,
                "remaining_lives": 6,
            },
        )
        self.assertEqual(res_p3.status_code, 200)
        self.assertEqual(res_p3.json()["rank"], 1)  # Player 3 has highest score

        res_p4 = self.client.post(
            "/api/results",
            json={
                "player_id": p4["id"],
                "final_score": 2410,
                "best_streak": 11,
                "accuracy": 92.0,
                "average_reaction_time": 350.0,
                "remaining_lives": 1,
            },
        )
        self.assertEqual(res_p4.status_code, 200)

        # Re-submitting for Player 2 should be idempotent (not overwrite or duplicate)
        res_p2_dup = self.client.post(
            "/api/results",
            json={
                "player_id": p2["id"],
                "final_score": 9999,
                "best_streak": 50,
                "accuracy": 100.0,
                "average_reaction_time": 100.0,
                "remaining_lives": 3,
            },
        )
        self.assertEqual(res_p2_dup.status_code, 200)
        self.assertEqual(res_p2_dup.json()["final_score"], 2850)  # Original score preserved!

        # Check leaderboard
        leaderboard = self.client.get("/api/leaderboard").json()
        self.assertEqual(len(leaderboard["all_entries"]), 4)
        self.assertEqual(leaderboard["top3"][0]["player_name"], "Player_Three")
        self.assertEqual(leaderboard["top3"][0]["final_score"], 4120)
        self.assertEqual(leaderboard["top3"][1]["player_name"], "Player_Two")
        self.assertEqual(leaderboard["top3"][1]["final_score"], 2850)
        self.assertEqual(leaderboard["top3"][2]["player_name"], "Player_Four")
        self.assertEqual(leaderboard["top3"][2]["final_score"], 2410)
        self.assertEqual(leaderboard["remaining"][0]["player_name"], "Player_One")

        # Check top 3 endpoint
        top3_data = self.client.get("/api/leaderboard/top3").json()
        self.assertEqual(top3_data["first"]["player_name"], "Player_Three")
        self.assertEqual(top3_data["second"]["player_name"], "Player_Two")
        self.assertEqual(top3_data["third"]["player_name"], "Player_Four")

        # Check individual result query for Player 2
        p2_detail = self.client.get(f"/api/results/{p2['id']}").json()
        self.assertEqual(p2_detail["rank"], 2)
        self.assertEqual(p2_detail["player_name"], "Player_Two")

    def test_countdown_and_reset(self):
        res = self.client.post("/api/session/start-countdown", json={"duration_seconds": 10})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "waiting")
        self.assertIsNotNone(res.json()["countdown_started_at"])

        # Reset session
        res_reset = self.client.post("/api/session/reset")
        self.assertEqual(res_reset.status_code, 200)
        self.assertEqual(res_reset.json()["status"], "registration")
        self.assertEqual(res_reset.json()["player_count"], 0)

    def test_websocket_lifecycle(self):
        with self.client.websocket_connect("/ws") as ws:
            # 1. First message is INITIAL_STATE
            init_data = json.loads(ws.receive_text())
            self.assertEqual(init_data["type"], "INITIAL_STATE")
            self.assertIn("session", init_data)

            # 2. Ping-pong
            ws.send_text(json.dumps({"type": "PING"}))
            pong = json.loads(ws.receive_text())
            self.assertEqual(pong["type"], "PONG")

            # 3. Register a player via REST while WS is open -> receives broadcast
            p = self.client.post("/api/players/register", json={"name": "WS_Player"}).json()
            broadcast_msg = json.loads(ws.receive_text())
            self.assertEqual(broadcast_msg["type"], "PLAYER_JOINED")
            self.assertEqual(broadcast_msg["player"]["name"], "WS_Player")


if __name__ == "__main__":
    unittest.main()
