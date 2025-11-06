document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

describe('fetchActivities additional edge cases', () => {
  let activitiesList;
  let activitySelect;
  
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="activities-list"></div>
      <select id="activity"></select>
    `;
    activitiesList = document.getElementById('activities-list');
    activitySelect = document.getElementById('activity');
    global.fetch = jest.fn();
    console.error = jest.fn();
  });

  test('handles malformed JSON response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON') }
    });

    await fetchActivities();

    expect(activitiesList.innerHTML).toContain('Failed to load activities');
    expect(console.error).toHaveBeenCalled();
  });

  test('handles server error response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server Error' })
    });

    await fetchActivities();

    expect(activitiesList.innerHTML).toContain('Failed to load activities');
  });

  test('displays zero spots left correctly', async () => {
    const mockActivities = {
      'Full Activity': {
        description: 'No spots available',
        schedule: 'Monday 10am',
        max_participants: 5,
        participants: ['1', '2', '3', '4', '5']
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities
    });

    await fetchActivities();

    expect(activitiesList.innerHTML).toContain('0 spots left');
  });

  test('displays maximum spots available', async () => {
    const mockActivities = {
      'Empty Activity': {
        description: 'All spots available',
        schedule: 'Monday 10am',
        max_participants: 10,
        participants: []
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities
    });

    await fetchActivities();

    expect(activitiesList.innerHTML).toContain('10 spots left');
  });

  test('handles special characters in activity names', async () => {
    const mockActivities = {
      '<Script>Alert(1)</Script>': {
        description: 'Test XSS',
        schedule: 'Monday 10am',
        max_participants: 5,
        participants: []
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities
    });

    await fetchActivities();

    expect(activitiesList.innerHTML).toContain('&lt;Script&gt;Alert(1)&lt;/Script&gt;');
    expect(activitySelect.options[0].value).toBe('<Script>Alert(1)</Script>');
  });

  test('handles missing activity details', async () => {
    const mockActivities = {
      'Incomplete Activity': {
        max_participants: 5
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities
    });

    await fetchActivities();

    expect(activitiesList.innerHTML).toContain('Incomplete Activity');
    expect(activitiesList.innerHTML).not.toContain('undefined');
  });
});
