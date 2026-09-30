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

admin_service_responding() {
  # A 401 login challenge still proves that Next.js is alive. Do not use
  # curl --fail here: it made every authenticated admin route look offline.
  /usr/bin/curl -sS --max-time 3 -o /dev/null "$local_url" >/dev/null 2>&1
}

stop_unresponsive_listener() {
  local pids
  pids="$(/usr/sbin/lsof -tiTCP:3010 -sTCP:LISTEN 2>/dev/null || true)"
  [[ -z "$pids" ]] && return

  for pid in ${(f)pids}; do
    /bin/kill "$pid" >/dev/null 2>&1 || true
  done

  for attempt in {1..5}; do
    /usr/sbin/lsof -tiTCP:3010 -sTCP:LISTEN >/dev/null 2>&1 || return
    /bin/sleep 1
  done
}

start_admin_service() {
  if ! /bin/launchctl print "$service_domain/$service_label" >/dev/null 2>&1; then
    /bin/mkdir -p "$HOME/Library/LaunchAgents"
    if [[ -f "$bundled_plist" ]]; then
      /bin/cp "$bundled_plist" "$installed_plist"
      /bin/launchctl bootstrap "$service_domain" "$installed_plist" >>"$log_file" 2>&1 || true
    fi
  fi

  /bin/launchctl kickstart -k "$service_domain/$service_label" >>"$log_file" 2>&1 || true
}

if ! admin_service_responding; then
  stop_unresponsive_listener
  start_admin_service

  for attempt in {1..45}; do
    admin_service_responding && break
    /bin/sleep 1
  done
fi

/usr/bin/open "$hub_url"

if ! admin_service_responding && [[ -f "$log_file" ]]; then
  /usr/bin/open -a TextEdit "$log_file"
fi
