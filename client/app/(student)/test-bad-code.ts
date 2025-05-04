import { createConnection } from "mysql";

const connection = createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "testdb",
});

connection.connect();

// Vulnerable function
function getUserData(userId: string): void {
  const query = `SELECT * FROM users WHERE id = '${userId}'`; // Unsanitized input
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Database error:", error);
    } else {
      console.log("User data:", results);
    }
  });
}

// Simulate user input
const userInput = "1 OR 1=1"; // SQL injection payload
getUserData(userInput);

connection.end();

