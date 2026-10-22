# UV + Docker workflow for agents

This folder is a uv project managed through Docker.
You do not need uv installed on your local machine.

## Add a dependency

Run from the development folder:

```bash

docker compose -f docker-compose.dev.yml run --rm -v ../agents:/app air_agent uv add <package-name>
```

Example:

```bash
docker compose -f docker-compose.dev.yml run --rm -v ../agents:/app air_agent uv add pika
```

## Apply dependency changes to the service

After adding or updating dependencies:

```bash
docker compose -f docker-compose.dev.yml build air_agent
docker compose -f docker-compose.dev.yml up -d air_agent
```

## Notes

- Dependencies are saved in pyproject.toml.
- Lock file is saved in uv.lock.
- The command uses a volume mount (-v ../agents:/app), so changes persist on your host files.
