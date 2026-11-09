# AnnaSeva — Requirements

AnnaSeva connects donors with surplus food (restaurants, caterers, wedding halls, hostel messes) to nearby NGOs that can collect and distribute it before it spoils.

## Users

| Role | Who | Core needs |
|---|---|---|
| **Donor** | Restaurant, caterer, hostel mess | Post food fast, see who claimed it, mark it picked up, cancel if plans change |
| **NGO** | Charity, shelter, community kitchen | See nearby food, claim it with confidence it is still available, find the pickup address |

## Functional requirements (user stories)

| # | As a... | I want to... | So that... |
|---|---|---|---|
| 1 | visitor | register as a donor or an NGO | I can use the right tools |
| 2 | user | log in and stay logged in | I don't retype my password constantly |
| 3 | donor | post a listing (what, how many, until when, where) | NGOs can find it |
| 4 | donor | see my listings and their status | I know what happened to my food |
| 5 | donor | mark a claimed listing as picked up | the record is accurate |
| 6 | donor | cancel a listing | NGOs don't travel for food that is gone |
| 7 | NGO | see available food near me, on a map and in a list | I can decide where to go |
| 8 | NGO | claim a listing | nobody else takes it |
| 9 | NGO | see my claims and get directions | I can collect the food |
| 10 | any user | see updates without refreshing | I'm never acting on stale information |
| 11 | visitor | see how many meals have been rescued | I trust the platform has impact |

## Non-functional requirements

| Requirement | Meaning in AnnaSeva |
|---|---|
| **Correctness** | A listing can never be claimed by two NGOs |
| **Freshness** | Expired food never appears in search results |
| **Security** | Passwords are hashed; only donors create listings; only owners modify their listings; secrets never reach Git |
| **Usability** | Works on a phone screen; clear loading, empty and error states |
| **Reliability** | A server error shows a friendly message, not a blank page |
| **Deployability** | A stranger can use it from a URL |

## Out of scope (MVP)

Volunteer/delivery role, payments, ratings, chat, push/email notifications, admin panel and NGO verification, Docker, CI/CD, TypeScript, Redis.

## Back-of-envelope traffic estimate

> Assumptions are mine and deliberately generous for a city-level launch.

| Source | Calculation | Per day |
|---|---|---|
| Donor writes | 500 donors × 3 listings/day | 1,500 |
| NGO reads | 2,000 NGOs × 5 checks/day | 10,000 |
| **Total** | | **11,500 operations/day** |

- Seconds per day: 24 × 60 × 60 = 86,400
- Average rate: 86,400 ÷ 11,500 ≈ **one operation every 7.5 seconds** (≈ 0.13 requests/second)

**Caveat:** that is an *average*. Real traffic is bursty: most donations happen around meal-service closing times (e.g. 2–4 pm and 10 pm–midnight). If, say, 50% of daily traffic lands in a 2-hour window, the peak is 5,750 ops ÷ 7,200 s ≈ 0.8 req/s, still about 6× the average.

**Conclusion:** even at peak, a single small server and the free MongoDB M0 tier are plenty. The hard problem in AnnaSeva is *correctness* (the atomic claim), not *scale*.
