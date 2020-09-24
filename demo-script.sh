# stay in main directory
cd application
########### setup wallet #############
# create wallet pat
node ./slp/create-wallet/create-wallet.js

# check balance wallet pat
node ./wallet/check-balance/check-balance.js

# fill wallet pat
  bcli generate 1000

  # send to wallet pat
  bcli sendtoaddress bchreg:qpupt7sp5lurvuzp5dlygth3fx7pqpq05c5kz5s7x5 100

  # mature the coin base
  bcli generate 1000

# create wallet slava
node ./slp/create-wallet/create-wallet.js

# check balance wallet slava
node ./wallet/check-balance/check-balance.js

########### create token #############
node ./slp/create-token/create-token.js

{
  "v": 3,
  "q": {
    "db": ["t"],
    "find": {},
    "project": {"tokenDetails": 1, "tokenStats": 1, "_id": 0 },
    "limit": 10000
  }
}

########### check token balance #############

# check slp token balance wallet 1
node ./slp/check-balance/check-balance.js

########### send token #############

# check balance wallet 1
node ./slp/send-token/send-token.js

# check balance wallet 2
node ./slp/check-balance/check-balance.js


##############################################
bcli generate 1000
bcli sendtoaddress bchreg:qrj00aexnl8fephkautnph5f6huysxv4yvwus72ct5 10000
bcli listaccounts
