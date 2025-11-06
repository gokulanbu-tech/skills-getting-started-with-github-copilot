// app.test.js
describe('fetchActivities', () => {
  let activitiesList;
  let activitySelect;
  
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="activities-list"></div>
      <select id="activity"></select>
    `;
    activitiesList = document.getElementById('activities-list');
    activitySelect = document.getElementById('activity');

    // Mock fetch
    global.fetch = jest.fn();
  });

  test('successfully fetches and displays activities', async () => {
    const mockActivities = {
      'Swimming': {
        description: 'Learn to swim',
        schedule: 'Monday 10am',
        max_participants: 10,
        participants: ['user1@test.com']
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities
    });

    await fetchActivities();

    // Check if activities list is populated
    expect(activitiesList.innerHTML).toContain('Swimming');
    expect(activitiesList.innerHTML).toContain('Learn to swim');
    expect(activitiesList.innerHTML).toContain('Monday 10am');
    expect(activitiesList.innerHTML).toContain('9 spots left');

    // Check if select options are added
    expect(activitySelect.options.length).toBe(1);
    expect(activitySelect.options[0].value).toBe('Swimming');
  });

  test('handles fetch error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Error'));

    await fetchActivities();

    expect(activitiesList.innerHTML).toContain('Failed to load activities');
    expect(console.error).toHaveBeenCalledWith('Error fetching activities:', expect.any(Error));
  });

  test('handles empty activities list', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await fetchActivities();

    expect(activitiesList.innerHTML).toBe('');
    expect(activitySelect.options.length).toBe(0);
  });
});