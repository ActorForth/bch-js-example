# create wallet 1
node create-wallet.js

# check balance wallet 1
node check-balance.js

# fill wallet 1
  bcli generate 1000

  # send to wallet 1
  bcli sendtoaddress bchreg:qpupt7sp5lurvuzp5dlygth3fx7pqpq05c5kz5s7x5 100

  # mature the coin base
  bcli generate 1000

# create wallet 2
node create-wallet.js

# check balance wallet 2
node check-balance.js

# check balance wallet 1
node check-balance.js

# check balance wallet 2
node check-balance.js
