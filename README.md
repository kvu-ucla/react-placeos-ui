# react-placeos-ui

AV control UI

## Backend requirements (ZoomZRC migration)

The UI's Zoom integration binds two PlaceOS modules on the system:

- **`ZoomZRC`** — the `Zoom::ZRC::Controller` driver (`zoom_zrc.cr`). Provides
  meeting/connection status (`meeting_status`, `meeting_active`, `mic_mute`,
  `camera_mute`, `online`, `participants`, …), meeting actions
  (`start_instant_meeting`, `join_meeting`, `exit_meeting`, `mute_audio`,
  `mute_video`, `send_meeting_password`, `confirm_prompt`, …).
- **`Bookings`** — the `Zoom::BookingConverter` driver (`booking_converter.cr`).
  Provides `bookings`, `current_booking` and `next_booking` as PlaceOS calendar
  events (`title`, `event_start`/`event_end` in unix seconds, `id` = Zoom
  meeting number).

`ZoomCSAPI` is **no longer used by the UI**.

> **KNOWN BACKEND DEPENDENCY:** `booking_converter` currently sources its list
> from `ZoomCSAPI_1:BookingsListResult`. It must be repointed at
> `ZoomZRC_1:meetings` (or the CSAPI module kept running for bookings only)
> before bookings work end-to-end.

### Prompt handling

The prompt UI (`src/components/prompts/`) renders purely from the ZoomZRC
driver's prompt status keys (`meeting_password_required`, `consent_prompt`,
`waiting_for_host`, `recording_request`, …). Each key holds the full event
payload and is cleared to `null` by the driver once the prompt is answered —
the UI keeps no local open/closed state.

### Support phone number

`src/config.ts` exports `SUPPORT_PHONE` / `SUPPORT_PHONE_DISPLAY`, currently
`null` pending a real number from the service owner. Phone links in the
Support and Settings modals are hidden until these are set.

### Features intentionally removed in the migration (no ZRC equivalent)

- Sharing start/stop from the UI (wired/wireless toggle)
- Mute-all participants
- Per-participant mute / expel
- Meeting passcode display
- Wireless sharing key display (users are pointed at the key on the room display)
