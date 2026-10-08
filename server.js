const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 5000;

const DATA_FILE = path.join(
  __dirname,
  "data.json"
);

app.use(cors());

app.use(express.json());


// ==========================================
// DATA FUNCTIONS
// ==========================================

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      users: [],
      emails: []
    };
  }

  return JSON.parse(
    fs.readFileSync(DATA_FILE, "utf8")
  );
}


function saveData(data) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      data,
      null,
      2
    )
  );
}


// ==========================================
// SERVER TEST
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Mail Backend Running",
    status: "OK"
  });
});


// ==========================================
// USERS
// ==========================================

app.get(
  "/api/users",
  (req, res) => {

    const data = readData();

    res.json({
      success: true,
      users: data.users
    });

  }
);


app.post(
  "/api/users",
  (req, res) => {

    const {
      name,
      email
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message:
          "Name and email are required"
      });
    }

    const data = readData();

    let user =
      data.users.find(
        (u) =>
          u.email.toLowerCase() ===
          email.toLowerCase()
      );

    if (!user) {

      user = {
        id:
          Date.now().toString() +
          Math.random()
            .toString(36)
            .substring(2),

        name,

        email:
          email.toLowerCase()
      };

      data.users.push(user);

      saveData(data);
    }

    res.json({
      success: true,
      user
    });

  }
);


// ==========================================
// INBOX
// ==========================================

app.get(
  "/api/emails/inbox",
  (req, res) => {

    const {
      user
    } = req.query;

    if (!user) {
      return res.status(400).json({
        message:
          "User email required"
      });
    }

    const data = readData();

    const emails =
      data.emails
        .filter(
          (email) =>
            email.receiverEmail ===
              user &&
            !email.archived &&
            !email.deleted
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    res.json({
      success: true,
      emails
    });

  }
);


// ==========================================
// SENT
// ==========================================

app.get(
  "/api/emails/sent",
  (req, res) => {

    const {
      user
    } = req.query;

    if (!user) {
      return res.status(400).json({
        message:
          "User email required"
      });
    }

    const data = readData();

    const emails =
      data.emails
        .filter(
          (email) =>
            email.senderEmail ===
              user &&
            !email.deleted
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    res.json({
      success: true,
      emails
    });

  }
);


// ==========================================
// SEND EMAIL
// ==========================================

app.post(
  "/api/emails",
  (req, res) => {

    const {
      senderName,
      senderEmail,
      receiverEmails,
      subject,
      message
    } = req.body;

    if (
      !senderName ||
      !senderEmail ||
      !receiverEmails ||
      receiverEmails.length === 0 ||
      !subject ||
      !message
    ) {

      return res.status(400).json({
        message:
          "Sender, recipients, subject and message are required"
      });

    }

    const data = readData();

    const createdEmails = [];

    receiverEmails.forEach(
      (receiverEmail) => {

        const email = {

          id:
            Date.now().toString() +
            Math.random()
              .toString(36)
              .substring(2),

          senderName,

          senderEmail,

          receiverEmail,

          subject,

          message,

          read: false,

          starred: false,

          archived: false,

          deleted: false,

          createdAt:
            new Date().toISOString()

        };

        data.emails.push(email);

        createdEmails.push(email);

      }
    );

    saveData(data);

    res.json({
      success: true,
      count:
        createdEmails.length,
      emails:
        createdEmails
    });

  }
);


// ==========================================
// MARK AS READ
// ==========================================

app.patch(
  "/api/emails/:id/read",
  (req, res) => {

    const data = readData();

    const email =
      data.emails.find(
        (e) =>
          e.id ===
          req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message:
          "Email not found"
      });
    }

    email.read = true;

    saveData(data);

    res.json({
      success: true,
      email
    });

  }
);


// ==========================================
// STAR
// ==========================================

app.patch(
  "/api/emails/:id/star",
  (req, res) => {

    const data = readData();

    const email =
      data.emails.find(
        (e) =>
          e.id ===
          req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message:
          "Email not found"
      });
    }

    email.starred =
      !email.starred;

    saveData(data);

    res.json({
      success: true,
      email
    });

  }
);


// ==========================================
// ARCHIVE
// ==========================================

app.patch(
  "/api/emails/:id/archive",
  (req, res) => {

    const data = readData();

    const email =
      data.emails.find(
        (e) =>
          e.id ===
          req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message:
          "Email not found"
      });
    }

    email.archived = true;

    saveData(data);

    res.json({
      success: true
    });

  }
);


// ==========================================
// DELETE
// ==========================================

app.delete(
  "/api/emails/:id",
  (req, res) => {

    const data = readData();

    const email =
      data.emails.find(
        (e) =>
          e.id ===
          req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message:
          "Email not found"
      });
    }

    email.deleted = true;

    saveData(data);

    res.json({
      success: true
    });

  }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(
  PORT,
  () => {

    console.log(
      `Mail backend running on http://localhost:${PORT}`
    );

  }
);