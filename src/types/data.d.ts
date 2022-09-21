export type calendarEvent = {
  id: string;
  status: string;
  htmlLink: string;
};

export type calendarApiResponse = {
  kind: string;
  etag: string;
  summary: string;
  updated: Date;
  timeZone: string;
  accessRole: string;
  defaultReminders: {
    method: string;
    minutes: number;
  };
  nextPageToken: string;
  items: Array<calendarApiResponseItem>;
};

export type calendarApiResponseItem = {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: Date;
  updated: Date;
  summary: string;
  description: string;
  location: string;
  creator: {
    email: string;
    self: boolean;
  };
  organizer: {
    email: string;
    self: boolean;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  endTimeUnspecified: boolean;
  transparency: string;
  visibility: string;
  iCalUID: string;
  sequence: string;
  hangoutLink?: string;
  attendees: Array<{
    email: string;
    self: boolean;
    responseStatus: boolean;
  }>;
  guestsCanInviteOthers: boolean;
  privateCopy: boolean;
  reminders: {
    useDefault: boolean;
  };
  source: {
    url: string;
    title: string;
  };
  eventType: string;
};
