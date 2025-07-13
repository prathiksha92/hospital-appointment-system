Hospital Appointment Booking System is a web-based application developed using Node.js, Express, MySQL, and Bootstrap. It enables patients to register, log in, and book appointments with doctors. The system also includes an admin panel where administrators can manage doctor information and view all appointments. The user interface is styled using Bootstrap for a clean and responsive experience.

The system supports features like patient login and registration, doctor listing and management by the admin, appointment booking by patients, and appointment cancellation. It uses session-based authentication for both patients and the admin to ensure security.

The application is structured in a modular way with clear separation between routes, views (HTML files), static assets (CSS/JS), and database configuration. Admin login credentials are hardcoded for demo purposes with the username as admin and password as admin123.

To set up the project, clone the GitHub repository, install dependencies using npm install, configure the MySQL database connection in a .env file, and run the server using node app.js. You can then access the app at http://localhost:3000 in your browser.

Future improvements to the project may include email notifications for booked appointments, better mobile responsiveness, doctor availability time slots, and profile image uploads for doctors.
