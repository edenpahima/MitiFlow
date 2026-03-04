# MitiFlow

Target project structure

mitiflow/
├── backend/
│   ├── src/
│   │   ├── simulator/        # Traffic + attack simulation
│   │   ├── collector/        # Receives + stores flow records
│   │   ├── detection/        # Threshold + anomaly detection
│   │   ├── mitigation/       # Rule generation + mock BGP
│   │   ├── api/              # Express routes
│   │   └── db/               # Postgres client + queries
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TrafficChart.tsx
│   │   │   ├── AttackList.tsx
│   │   │   └── MitigationRules.tsx
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
