#!/bin/sh

# colors
COLOR_RED="\x1b[31m"
COLOR_GREEN="\x1b[32m"
COLOR_RESET="\x1b[0m"

# prepare the dev environment
git clean -fxd
npm install
bower install

if [ $? -ne 0 ]; then
  echo "$COLOR_RED"
  echo "\nINIT FAILED!\n"
  exit 1
fi

echo "$COLOR_GREEN"
echo "\nGO FORTH AND CONQUER\n"

echo "At any time you may:"
echo "--------------------"
echo "grunt -h    # show available tasks."
echo "grunt dev   # lint and test, open the project web site and watch."
echo "grunt qa    # initialize your environment, check code quality and open the project web site."
echo ""

echo "$COLOR_RESET"
exit 0
