/*
  Check the BCH and SLP token balances for the wallet created with the
  create-wallet example app.

  TODO:
  - Add diffentiator for TokenType1 vs NFT1.
*/

// uncomment to select network
// const NETWORK = 'mainnet'
// const NETWORK = 'testnet'
const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
const REGTEST_API_FREE = 'http://localhost:3000/v3/'

const WALLET_NAME = `wallet-info-${NETWORK}-pat`

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('bch-js-reg')

// Instantiate bch-js based on the network.
let bchjs
let regtest
switch (NETWORK) {
  case 'mainnet':
    bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
    regtest = false
    break
  case 'testnet':
    bchjs = new BCHJS({ restURL: TESTNET_API_FREE })
    regtest = false
    break
  case 'regtest':
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
    regtest = true
    break
  default:
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
    regtest = true
}

// Open the wallet generated with create-wallet.
let walletInfo
try {
  walletInfo = require(`../../${WALLET_NAME}.json`)
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with create-wallet first.'
  )
  process.exit(0)
}

async function getBalance () {
  try {
    const mnemonic = walletInfo.mnemonic

    // root seed buffer
    const rootSeed = await bchjs.Mnemonic.toSeed(mnemonic)

    // master HDNode
    let masterHDNode
    if (NETWORK === 'mainnet') masterHDNode = bchjs.HDNode.fromSeed(rootSeed)
    else masterHDNode = bchjs.HDNode.fromSeed(rootSeed, NETWORK) // Testnet

    // HDNode of BIP44 account
    const account = bchjs.HDNode.derivePath(masterHDNode, "m/44'/245'/0'")

    const change = bchjs.HDNode.derivePath(account, '0/0')

    // get the cash address
    const cashAddress = bchjs.HDNode.toCashAddress(change, regtest)
    const slpAddress = bchjs.SLP.Address.toSLPAddress(cashAddress, true, regtest)

    // first get BCH balance
    const balance = await bchjs.Electrumx.balance(cashAddress)

    console.log(`BCH Balance information for ${slpAddress}:`)
    console.log(`${JSON.stringify(balance.balance, null, 2)}`)
    console.log('SLP Token information:')

    // get token balances
    try {
      const tokens = await bchjs.SLP.Utils.balancesForAddress(slpAddress)

      console.log(JSON.stringify(tokens, null, 2))
    } catch (error) {
      if (error.message === 'Address not found') console.log('No tokens found.')
      else console.log('Error: ', error)
    }
  } catch (err) {
    console.error('Error in getBalance: ', err)
    console.log(`Error message: ${err.message}`)
    throw err
  }
}
getBalance()
