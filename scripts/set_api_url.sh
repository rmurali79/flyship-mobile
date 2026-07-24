#!/bin/bash
# Usage: bash scripts/set_api_url.sh https://flyship-backend-xxxxx-uc.a.run.app

cd "$(dirname "$0")/.."

if [ -z "$1" ]; then
    echo "Usage: bash set_api_url.sh <BACKEND_URL>"
    echo "Example: bash set_api_url.sh https://flyship-backend-abc123-uc.a.run.app"
    exit 1
fi

URL="$1"
echo "Setting API base URL to: $URL"

if command -v python3 &>/dev/null; then
    python3 -c "
import json
with open('app.json') as f: data = json.load(f)
data['expo']['extra']['apiBase'] = '$URL'
with open('app.json', 'w') as f: json.dump(data, f, indent=2)
print('Updated app.json')
"
fi

sed -i '' "s|const API_BASE = .*|const API_BASE = Constants.expoConfig?.extra?.apiBase || '$URL';|" src/config/api.js
echo "Updated src/config/api.js"

echo "Done! Restart the dev server for changes to take effect."
