# Database Explorer Context

Generated: 2026-02-22T22:11:10.866Z

## Tables

- customers
- support_cases

## Relationships

No foreign key relationships found.

## Table Details

### customers

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| id | uuid | PK | - |
| email | text | - | - |
| created_at | timestamp without time zone | - | - |
| plan | text | - | - |

Top 10 records:

| id | email | created_at | plan |
| --- | --- | --- | --- |
| `1f4dc0e3-db5d-4251-b130-b82b4dca78fb` | `user1@example.com` | `2026-01-04T07:37:20.623Z` | `pro` |

### support_cases

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| id | uuid | PK | - |
| created_at | timestamp without time zone | - | - |
| status | text | - | - |
| priority | text | - | - |
| assigned_agent | text | - | - |

Top 10 records:

| id | created_at | status | priority | assigned_agent |
| --- | --- | --- | --- | --- |
| `303ca3b3-877b-409f-bc53-dcaf7ba1d2b7` | `2026-01-04T07:36:35.310Z` | `open` | `high` | `agent_1` |
| `e46b2385-d582-4e6b-b994-5ef425e11512` | `2026-01-04T07:36:35.310Z` | `closed` | `low` | `agent_2` |


_This file is auto-generated and cleared when DB Explorer is exited._
