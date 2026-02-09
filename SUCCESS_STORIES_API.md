# Success Stories API (Admin se videos ke liye)

Home page pe **"Stories that inspire"** section admin ke add kiye hue videos API se fetch karta hai.

## Frontend expect karta hai

- **Endpoint:** `GET /api/student/success-stories` (auth required – Bearer token)
- **Response shape (koi bhi ek):**
  - Direct array: `[{ id, student_name, ... }, ...]`
  - Ya: `{ data: [...] }` ya `{ list: [...] }`

## Har story item ke fields (camelCase ya snake_case dono chalenge)

| Field            | Type   | Required | Description                    |
|-----------------|--------|----------|--------------------------------|
| id              | string | Yes      | Unique ID                      |
| student_name    | string | Yes      | Student ka naam                |
| achievement     | string | No       | e.g. "AIR 2973 \| NEET 2024"   |
| video_thumbnail | string | No       | Thumbnail image URL (full URL ya relative path) |
| video_url       | string | No       | Video play karne wala URL (mp4, etc.) |
| duration        | string | No       | e.g. "00:45", "1:20"           |
| followers       | number | No       | Display ke liye               |
| brand_name      | string | No       |                                |
| brand_logo      | string | No       | Logo URL                       |
| description     | string | No       | Short description              |

## Admin side

- Admin panel se success stories add/edit/delete karo.
- Har story ke liye **video_url** (video link) aur **video_thumbnail** (image link) set karo.
- Order backend jaisa bhi define kare (e.g. `order` field ya created_at) — frontend jo list milegi wahi order dikhata hai.

## Example response

```json
{
  "data": [
    {
      "id": "1",
      "student_name": "Priya Sharma",
      "achievement": "AIR 2973 | NEET 2024",
      "video_thumbnail": "/uploads/thumb1.jpg",
      "video_url": "https://example.com/videos/priya-story.mp4",
      "duration": "00:45",
      "followers": 1250,
      "brand_name": "MySilkLove",
      "description": "After joining this platform, I cracked my dream exam!"
    }
  ]
}
```

Relative paths (e.g. `/uploads/thumb1.jpg`) frontend automatically base URL se resolve karta hai.
