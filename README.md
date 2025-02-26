# College Event Website

## Term Project for COP 4710 - Spring 2025

### Application Overview
The College Event Website is a web-based application designed to allow students, Registered Student Organizations (RSOs), and university administrators to manage and engage with campus events. The platform offers a solution to the problem of keeping track of university events, which are often scattered across different websites or only posted for specific groups.

The application is structured around three different user roles:
1. **Super Admin** – Manages university profiles and approves public events.
2. **Admin** – Owns an RSO, creates events for the RSO, and manages event details.
3. **Student** – Registers for the platform, views events, comments on events, and rates them.

The website allows students to view various types of events, interact with event content, and keep track of upcoming events. It also supports event creation, commenting, and event categorization (social, fundraising, tech talks, etc.).

### Problem Statement
Universities host numerous events each semester, often organized by student groups (RSOs), but current university websites are limited in the information they provide to students regarding these events. This project solves the problem by providing a centralized platform where all events—whether public or private—can be easily tracked, viewed, and interacted with by students.

### Features
- **User Registration**: Users can register for an account and get a user ID and password.
- **Roles**:
  - **Super Admin**: Creates and manages university profiles, approves public events.
  - **Admin**: Owns an RSO, creates and manages events, and can assign RSO memberships.
  - **Student**: Views public events, private events (specific to their university), and RSO events. Students can comment, rate, and edit comments on events.
- **Event Creation**: Admins can create events with the following details:
  - Event Name
  - Event Category (e.g., social, fundraising, tech talks)
  - Event Description
  - Date and Time
  - Location (integrated with map services like Bing, Google, or OpenStreetMap)
  - Contact Information (Phone and Email)
- **Event Visibility**: Events can be marked as public, private (university-specific), or RSO-specific.
- **RSO Management**: Students can join existing RSOs or create new ones if they meet the requirements (at least 4 students with the same university email domain).
- **Event Interactions**: Students can comment, rate, and update their comments on events.
- **Social Network Integration**: Users can share events on social media platforms such as Facebook or Google.
- **Event Approval**: Super Admins must approve events that are created without an RSO affiliation (public events).

### Technologies Used
- **Frontend**:
  - HTML5, CSS3, JavaScript
  - React for UI components
  - Map API Integration (OpenStreetMap)
  - Social media API integration (Facebook, Google)
- **Backend**:
  - Node.js/Express for the server-side logic
  - MySQL for the database
- **Authentication**:
  - JWT (JSON Web Tokens) for user authentication
- **Event Feeds**:
  - Data can be populated from external RSS/feeds (e.g., events.ucf.edu)
  
### Installation and Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/college-event-website.git
