#!/bin/zsh
set -u

local_url="http://127.0.0.1:3010/admin/pipeline"
hub_url="https://www.vegan-masala.com/admin/social"
log_file="/tmp/vegan-masala-admin.log"
service_label="com.veganmasala.admin"
service_domain="gui/$(/usr/bin/id -u)"
project_dir="/Users/craiglogue/Documents/ChatGPT/Vegan Masala website/vegan-masala"
bundled_plist="$project_dir/mac/$service_label.plist"
installed_plist="$HOME/Library/LaunchAgents/$service_label.plist"

start_admin_service() {
  # The service may disappear after a macOS cleanup, migration or logout.
  # Restore it from the copy kept with the project before trying to start it.
  if ! /bin/launchctl print "$service_domain/$service_label" >/dev/null 2>&1; then
    /bin/mkdir -p "$HOME/Library/LaunchAgents"
    if [[ -f "$bundled_plist" ]]; then
      /bin/cp "$bundled_plist" "$installed_plist"
      /bin/launchctl bootstrap "$service_domain" "$installed_plist" >>"$log_file" 2>&1 || true
    fi
  fi

  /bin/launchctl kickstart -k "$service_domain/$service_label" >>"$log_file" 2>&1 || true
}

if ! /usr/bin/curl -fsS --max-time 2 "$local_url" >/dev/null 2>&1; then
  start_admin_service

  for attempt in {1..45}; do
    if /usr/bin/curl -fsS --max-time 2 "$local_url" >/dev/null 2>&1; then
      break
    fi
    /bin/sleep 1
  done
fi

if /usr/bin/curl -fsS --max-time 2 "$local_url" >/dev/null 2>&1; then
  /usr/bin/open "$hub_url"
  exit 0
fi

# The live hub remains useful even if the local development service cannot start.
# Open it instead of making the desktop application appear to crash.
/usr/bin/open "$hub_url"
[[ -f "$log_file" ]] && /usr/bin/open -a TextEdit "$log_file"
exit 0
