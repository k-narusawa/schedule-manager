'use strict';

import { calendarApiResponse } from './types';
import { useDate } from './util/dateUtil';

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'FETCH_CALENDAR') {
    const storage = await chrome.storage.local.get();
    const calendarEvents = await apiRequest(
      storage.accessToken,
      storage.maxResults
    );
    const items = await calendarEvents.items;

    if (items && items.length == 0) return;

    chrome.storage.local.set({
      items: items,
    });
  }
});

const apiRequest = (
  accessToken: string,
  maxResults?: string
): Promise<calendarApiResponse> => {
  const params = {
    maxResults: maxResults ? maxResults : '5',
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
