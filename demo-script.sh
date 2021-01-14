# stay in main directory
cd application

########### introduce our environment #############

bcli getblockchaininfo

bcli listaccounts

########### setup wallet #############
# create wallet pat
node ./slp/create-wallet/create-wallet.js

# check balance wallet pat
node ./slp/check-balance/check-balance.js

# fill wallet pat
  bcli generate 1000

  # send to wallet pat
  bcli sendtoaddress bchreg:qpupt7sp5lurvuzp5dlygth3fx7pqpq05c5kz5s7x5 100

  # mature the coin base
  bcli generate 1000

# create wallet slava
node ./slp/create-wallet/create-wallet.js

# check balance wallet slava
node ./slp/check-balance/check-balance.js


########### send bch #############

node ./wallet/send-bch/send-bch.js

########### create token #############
node ./slp/create-token/create-token.js

{
  "v": 3,
  "q": {
    "db": ["t"],
    "find":
    {
      "$query":
      {
        "tokenDetails.tokenIdHex": "959a6818cba5af8aba391d3f7649f5f6a5ceb6cdcd2c2a3dcb5d2fbfc4b08e98"
      }
    },
    "project": {"tokenDetails": 1, "tokenStats": 1, "_id": 0 },
    "limit": 1000
  }
}

# confirm tx
bcli generate 1000

########### check token balance #############

# check slp token balance wallet 1
node ./slp/check-balance/check-balance.js

########### send token #############

# check balance wallet 1
node ./slp/send-token/send-token.js

# confirm tx
bcli generate 1000

# check balance wallet 2
node ./slp/check-balance/check-balance.js


##############################################
./setup js slpdb node rest
./run server js slpdb

bcli getblockchaininfo
bcli generate 1000
bcli sendtoaddress bchreg:qrj00aexnl8fephkautnph5f6huysxv4yvwus72ct5 1000
bcli listaccounts

##############################################
{
  "v": 3,
  "q": {
    "find": {
      "$query":
      {
        "tokenDetails.tokenIdHex": "1a12ae28c0d8e430491740d3305c2114a8a4e60aba892421371699ce5dc2cc7a"
      }
    },
    "limit": 10
  }
}



{
  "v": 3,
  "q": {
    "find": {
      "out.s4": "\u0012䋏w��G[nO�T��^�d\u0006�.\u0012\u0012��J#d��"
    }
  }
}



{
  "v": 3,
  "q": {
    "find": {},
    "limit": 10
  }
}


{
  "v": 3,
  "q": {
    "db": ["c"],
    "find":
    {
      "$query":
      {
        "tx.h": "da9162f12608029a8d6b015fc06d632937e7611f840c6c61416fefe97d4328de"
      }
    },
    "limit": 1000
  }
}


{
  "v": 3,
  "q": {
    "find": {
      "$and": [
        {
          "out.b5": { "op": 174 }
        },
        {
          "out.b4": { "op": 83 }
        }
        ,
        {
          "out.b0": { "op": 81 }
        }
      ]
    },
    "limit": 10
  }
}
