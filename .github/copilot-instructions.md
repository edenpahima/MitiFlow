# MitiFlow AI Coding Guidelines

## Architecture Overview
MitiFlow is a DDoS mitigation simulation platform built with NestJS. It simulates network attacks and tests mitigation strategies using a PostgreSQL database.

**Core Modules:**
- `simulator/`: Generates synthetic attack traffic (SYN floods, UDP amplification, ICMP floods) and stores flow records
- `db/`: TypeORM entities for flow records, attack events, and mitigation rules
- `api/`: REST endpoints for controlling simulations
- `collector/`, `detection/`, `mitigation/`: Planned modules for flow collection, anomaly detection, and rule generation

**Data Flow:** Simulator injects flows → DB stores records → Future detection analyzes patterns → Mitigation generates BGP-like rules

## Key Conventions
- **Entities**: Use string UUID primary keys, snake_case table names (e.g., `flow_records`). Include `@Index` on frequently queried fields like `timestamp` and `dstIp`.
- **Attack Types**: Limited to `'syn-flood' | 'udp-amplification' | 'icmp-flood' | 'unknown'`
- **Intensities**: `'low' | 'medium' | 'high'` with multipliers (50x, 200x, 500x flows/tick)
- **Statuses**: Attacks use `'active' | 'mitigated' | 'resolved'`; Rules use `'active' | 'withdrawn'`
- **Actions**: Mitigation actions are `'drop' | 'rate-limit' | 'redirect-scrubbing'`

## Development Workflow
- **Setup**: Run `docker-compose up` for PostgreSQL + Adminer, then `npm run start:dev` in `backend/`
- **Database**: TypeORM `synchronize: true` auto-creates tables; use Adminer at `localhost:8080` for inspection
- **API Testing**: Use curl for simulation control (see `README.md` examples)
- **Cleanup**: Simulator auto-deletes flows older than 10 minutes via `@Interval(60000)` cron job

## Code Patterns
- **Services**: Inject repositories via `@InjectRepository`; use Logger for operations
- **Modules**: Import `TypeOrmModule.forFeature([Entity])` for entity access
- **Controllers**: Simple REST with JSON bodies; return status messages with request data
- **Enums**: Define types inline (e.g., `type Intensity = 'low' | 'medium' | 'high'`) rather than TS enums

## Examples
- Entity definition: See `src/db/entities/flow-record.entity.ts` for indexed columns
- Service injection: `constructor(@InjectRepository(FlowRecord) private flowRepo: Repository<FlowRecord>)`
- API endpoint: `@Post('syn-flood')` with body `{ victimIp: string; intensity: Intensity }`

Focus on extending simulator logic, implementing detection algorithms, and building mitigation rule engines.</content>
<parameter name="filePath">/Users/edenpahima/studies/MitiFlow/.github/copilot-instructions.md