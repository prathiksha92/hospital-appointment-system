const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const bcrypt = require('bcrypt');

// GET: Show registration page
router.get('/register', (req, res) => {
  res.sendFile('register.html', { root: './views' });
});

// POST: Handle patient registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO patients (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.send('❌ Error: Email might already exist.');
      }
      res.redirect('/login');
    }
  );
});
// GET: Login form
router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: './views' });
});

// POST: Login verification
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM patients WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.send('❌ Server error');
    }

    if (results.length === 0) {
      return res.send('❌ No user found with this email');
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
  // Save user in session
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email
  };
  res.redirect('/dashboard');  // ✅ Go to dashboard
} else {
  res.send('❌ Incorrect password');
}

  });
});
// GET: Serve booking page
router.get('/book', (req, res) => {
  res.sendFile('book.html', { root: './views' });
});

// GET: Get list of doctors (for dropdown)
router.get('/doctors', (req, res) => {
  db.query('SELECT id, name, specialty FROM doctors', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(results);
  });
});

// POST: Book appointment
router.post('/book', (req, res) => {
  const { email, doctor_id, appointment_date, time_slot } = req.body;

  // Get patient_id from email
  db.query('SELECT id FROM patients WHERE email = ?', [email], (err, result) => {
    if (err || result.length === 0) {
      return res.send('❌ Patient not found');
    }

    const patient_id = result[0].id;

    db.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status) VALUES (?, ?, ?, ?, ?)',
      [patient_id, doctor_id, appointment_date, time_slot, 'Scheduled'],
      (err2, result2) => {
        if (err2) {
          console.error(err2);
          return res.send('❌ Error booking appointment');
        }
        res.send('✅ Appointment booked successfully!');
      }
    );
  });
});
// GET: View Appointments by patient email
router.get('/appointments', (req, res) => {
  const email = req.query.email;

  db.query(
    `SELECT a.id AS id, d.name AS doctor_name, d.specialty, a.appointment_date, a.time_slot, a.status
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     JOIN patients p ON a.patient_id = p.id
     WHERE p.email = ?`,
    [email],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json([]);
      }
      res.json(results);
    }
  );
});

// GET: View appointments page
router.get('/view', (req, res) => {
  res.sendFile('view.html', { root: './views' });
});
// GET: Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.send('❌ Error logging out.');
    }
    res.redirect('/login');
  });
});
router.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Patient Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body class="bg-light">
    <div class="container text-center mt-5">
      <h2 class="mb-4">👋 Welcome, ${req.session.user.name}</h2>
      <div class="d-grid gap-3 col-6 mx-auto">
        <a href="/book" class="btn btn-primary">📅 Book Appointment</a>
        <a href="/view" class="btn btn-info">📄 View Appointments</a>
        <a href="/logout" class="btn btn-danger">🚪 Logout</a>
      </div>
    </div>
  </body>
  </html>
  `);
});


// DELETE: Cancel appointment by ID
router.delete('/cancel/:id', (req, res) => {
  const appointmentId = req.params.id;

  db.query('DELETE FROM appointments WHERE id = ?', [appointmentId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('❌ Error cancelling appointment');
    }
    res.send('✅ Appointment cancelled successfully');
  });
});
// GET: Admin login page
router.get('/admin', (req, res) => {
  res.sendFile('adminLogin.html', { root: './views' });
});

// POST: Admin login (simple static login for demo)
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  // Dummy login (you can connect with DB later)
  if (username === 'admin' && password === 'admin123') {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  } else {
    res.send('❌ Invalid admin credentials');
  }
});

// GET: Admin dashboard
router.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container text-center mt-5">
    <h2 class="mb-4">👩‍⚕️ Admin Dashboard</h2>
    <div class="d-grid gap-3 col-6 mx-auto">
      <a href="/admin/add-doctor" class="btn btn-success">➕ Add Doctor</a>
      <a href="/admin/view-doctors" class="btn btn-warning">📋 View Doctors</a>
      <a href="/admin/view-appointments" class="btn btn-info">📅 View All Appointments</a>
      <a href="/logout" class="btn btn-danger">🚪 Logout</a>
    </div>
  </div>
</body>
</html>
`);

});
// GET: Add Doctor Form
router.get('/admin/add-doctor', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  res.sendFile('addDoctor.html', { root: './views' });
});

// POST: Insert Doctor into DB
router.post('/admin/add-doctor', (req, res) => {
  const { name, specialty } = req.body;

  db.query(
    'INSERT INTO doctors (name, specialty) VALUES (?, ?)',
    [name, specialty],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.send('❌ Error adding doctor');
      }
      res.redirect('/admin/dashboard');
    }
  );
});

// GET: View all doctors
router.get('/admin/view-doctors', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');

  db.query('SELECT * FROM doctors', (err, results) => {
    if (err) {
      console.error(err);
      return res.send('❌ Error loading doctors');
    }

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>View Doctors</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
      <div class="container mt-5">
        <h2 class="mb-4 text-center">📋 All Doctors</h2>
        <table class="table table-bordered table-hover">
          <thead class="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Specialty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>`;

    results.forEach((doc, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${doc.name}</td>
          <td>${doc.specialty}</td>
          <td>
            <a href="/admin/delete-doctor/${doc.id}" class="btn btn-danger btn-sm" onclick="return confirm('Are you sure?')">❌ Delete</a>
          </td>
        </tr>`;
    });

    html += `
          </tbody>
        </table>
        <div class="text-center">
          <a href="/admin/dashboard" class="btn btn-secondary mt-3">⬅️ Back to Dashboard</a>
        </div>
      </div>
    </body>
    </html>
    `;

    res.send(html);
  });
});

// GET: Delete doctor by ID
// GET: Delete doctor by ID
router.get('/admin/delete-doctor/:id', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');

  const doctorId = req.params.id;

  // First delete all appointments linked to this doctor
  db.query('DELETE FROM appointments WHERE doctor_id = ?', [doctorId], (err1) => {
    if (err1) {
      console.error(err1);
      return res.send('❌ Error deleting doctor appointments');
    }

    // Then delete the doctor
    db.query('DELETE FROM doctors WHERE id = ?', [doctorId], (err2) => {
      if (err2) {
        console.error(err2);
        return res.send('❌ Error deleting doctor');
      }
      res.redirect('/admin/view-doctors');
    });
  });
});
// GET: Admin view all appointments
router.get('/admin/view-appointments', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');

  const sql = `
    SELECT a.id, p.name AS patient_name, d.name AS doctor_name,
           a.appointment_date, a.time_slot, a.status
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.appointment_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.send('❌ Error fetching appointments');
    }

    let html = '<h2>📅 All Appointments</h2><table border="1" cellpadding="8">';
    html += '<tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr>';

    results.forEach(row => {
      html += `<tr>
        <td>${row.id}</td>
        <td>${row.patient_name}</td>
        <td>${row.doctor_name}</td>
        <td>${row.appointment_date}</td>
        <td>${row.time_slot}</td>
        <td>${row.status}</td>
      </tr>`;
    });

    html += '</table><br><a href="/admin/dashboard">⬅️ Back to Dashboard</a>';
    res.send(html);
  });
});

// GET: Landing page to choose login type
router.get('/', (req, res) => {
  res.sendFile('chooseLogin.html', { root: './views' });
});

module.exports = router;
