#!/bin/bash

#
# Instructions for viewing the trial
#

npm install
bower install
grunt sass

# open the index.html file in your browser to see a demo
open index.html

# index.html also has a demo network editor controller inside it for demonstration purposes

# There is also a local .git repo.  (It's not hosted publically.)


#
# unit-testing specific instructions
#

grunt karma



#
# E2E-testing specific instructions
#

# update selenium webdriver (needed by protractor)
./node_modules/protractor/bin/webdriver-manager update

# run this in the background or another window
./node_modules/protractor/bin/webdriver-manager start


# This is a simple web server that just servers up the current directory.  If this is integrated into the main app, this won't be necessary
# as we'll just connect to the local express server.
sudo npm install -g httpster

# run this in the background or another window
httpster


grunt protractor

