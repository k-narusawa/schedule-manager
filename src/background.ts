'use strict';

import { calendarApiResponse } from './types';
import { useDate } from './util/dateUtil';

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'FETCH_CALENDAR') {
    // Log message coming from the `request` parameter
    console.log(request.type);
    const storage = await chrome.storage.local.get();
    const calendarEvents = await apiRequest(storage.accessToken);
    const items = await calendarEvents.items;

    chrome.storage.local.set({
      items: items,
    });

    // Send a response message
    sendResponse({
      a: 'a',
    });
  }
});

const apiRequest = (accessToken: string): Promise<calendarApiResponse> => {
  const params = {
    maxResults: '5',
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: useDate().now(),
    timeMax: useDate().endOfToday(),
  };

  const queryParams = new URLSearchParams(params);
  return fetch(`${process.env.CALENDAR_API_URL}?${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=utf-8',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw Error();
      }
      return response.json();
    })
    .catch((error) => {
      console.log(error);
    });
};
