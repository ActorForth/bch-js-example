/*
  Send 1000 satoshis to RECV_ADDR.
*/

// Set NETWORK to either testnet or mainnet
const NETWORK = 'testnet'
// Replace the address below with the address you want to send the BCH to.
let RECV_ADDR = ''
// set satoshi amount to send
const SATOSHIS_TO_SEND = 1000

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
// const MAINNET_API_PAID = 'https://api.fullstack.cash/v3/'
// const TESTNET_API_PAID = 'https://tapi.fullstack.cash/v3/'

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('@chris.troutner/bch-js')

// Instantiate bch-js based on the network.
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
else bchjs = new BCHJS({ restURL: TESTNET_API_FREE })

// Open the wallet generated with create-wallet.
try {
  var walletInfo = require('../create-wallet/wallet2.json')
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with create-wallet first.'
  )
  process.exit(0)
}

const SEND_ADDR = walletInfo.cashAddress
const SEND_MNEMONIC = walletInfo.mnemonic

async function sendBch () {
  try {
    // Get the balance of the sending address.
    const balance = await getBCHBalance(SEND_ADDR, false)
    console.log(`balance: ${JSON.stringify(balance, null, 2)}`)
    console.log(`Balance of sending address ${SEND_ADDR} is ${balance} BCH.`)

    // Exit if the balance is zero.
    if (balance <= 0.0) {
      console.log('Balance of sending address is zero. Exiting.')
      process.exit(0)
    }

    // If the user fails to specify a reciever address, just send the BCH back
    // to the origination address, so the example doesn't fail.
    if (RECV_ADDR === '') RECV_ADDR = SEND_ADDR

    // Convert to a legacy address (needed to build transactions).
    const SEND_ADDR_LEGACY = bchjs.Address.toLegacyAddress(SEND_ADDR)
    const RECV_ADDR_LEGACY = bchjs.Address.toLegacyAddress(RECV_ADDR)
    console.log(`Sender Legacy Address: ${SEND_ADDR_LEGACY}`)
    console.log(`Receiver Legacy Address: ${RECV_ADDR_LEGACY}`)

    // Get UTXOs held by the address.
    // https://developer.bitcoin.com/mastering-bitcoin-cash/4-transactions/
    const utxos = await bchjs.Electrumx.utxo(SEND_ADDR)
    console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

    if (utxos.utxos.length === 0) throw new Error('No UTXOs found.')

    // console.log(`u: ${JSON.stringify(u, null, 2)}`
    const utxo = await findBiggestUtxo(utxos.utxos)
    console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

    // instance of transaction builder
    let transactionBuilder
    if (NETWORK === 'mainnet') {
      transactionBuilder = new bchjs.TransactionBuilder()
    } else transactionBuilder = new bchjs.TransactionBuilder('testnet')

    // Essential variables of a transaction.
    const satoshisToSend = SATOSHIS_TO_SEND
    console.log('SATOSHISTOSEND', satoshisToSend)
    const originalAmount = utxo.value
    console.log('ORIGINALAMOUNT', originalAmount)
    const vout = utxo.tx_pos
    console.log('VOUT', vout)
    const txid = utxo.tx_hash
    console.log('TXID', txid)

    // add input with txid and index of vout
    transactionBuilder.addInput(txid, vout)

    // get byte count to calculate fee. paying 1.2 sat/byte
    const byteCount = bchjs.BitcoinCash.getByteCount(
      { P2PKH: 1 },
      { P2PKH: 2 }
    )
    console.log(`Transaction byte count: ${byteCount}`)
    // 1.0 is the minimum
    const satoshisPerByte = 1.0
    const txFee = Math.floor(satoshisPerByte * byteCount)
    console.log(`Transaction fee: ${txFee}`)

    // amount to send back to the sending address.
    // It's the original amount - 1 sat/byte for tx size
    const remainder = originalAmount - satoshisToSend - txFee

    if (remainder < 0) { throw new Error('Not enough BCH to complete transaction!') }

    // add output w/ address and amount to send
    transactionBuilder.addOutput(RECV_ADDR, satoshisToSend)
    transactionBuilder.addOutput(SEND_ADDR, remainder)

    // Generate a change address from a Mnemonic of a private key.
    const change = await changeAddrFromMnemonic(SEND_MNEMONIC)
    console.log('CHANGE', change)

    // Generate a keypair from the change address.
    const keyPair = bchjs.HDNode.toKeyPair(change)
    console.log('KEYPAIR', keyPair)

    // Sign the transaction with the HD node.
    let redeemScript
    transactionBuilder.sign(
      0,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      originalAmount
    )
    console.log('TRANSACTIONBUILDER', transactionBuilder)

    // build tx
    const tx = transactionBuilder.build()
    console.log('TX', tx)
    // output rawhex
    const hex = tx.toHex()
    console.log(`TX hex: ${hex}`)
    console.log(' ')

    // Broadcast transation to the network
    const txidStr = await bchjs.RawTransactions.sendRawTransaction([hex])
    console.log('TXIDSTR', txidStr)
    // import from util.js file
    const util = require('../util.js')
    console.log(`Transaction ID: ${txidStr}`)
    console.log('Check the status of your transaction on this block explorer:')
    util.transactionStatus(txidStr, NETWORK)
  } catch (err) {
    console.log('error: ', err)
  }
}
sendBch()

// Generate a change address from a Mnemonic of a private key.
async function changeAddrFromMnemonic (mnemonic) {
  // root seed buffer
  const rootSeed = await bchjs.Mnemonic.toSeed(mnemonic)

  // master HDNode
  let masterHDNode
  if (NETWORK === 'mainnet') masterHDNode = bchjs.HDNode.fromSeed(rootSeed)
  else masterHDNode = bchjs.HDNode.fromSeed(rootSeed, 'testnet')

  // HDNode of BIP44 account
  const account = bchjs.HDNode.derivePath(masterHDNode, "m/44'/145'/0'")

  // derive the first external change address HDNode which is going to spend utxo
  const change = bchjs.HDNode.derivePath(account, '0/0')

  return change
}

// Get the balance in BCH of a BCH address.
async function getBCHBalance (addr, verbose) {
  try {
    const result = await bchjs.Electrumx.balance(addr)

    if (verbose) console.log(result)

    // The total balance is the sum of the confirmed and unconfirmed balances.
    const satBalance =
      Number(result.balance.confirmed) + Number(result.balance.unconfirmed)

    // Convert the satoshi balance to a BCH balance
    const bchBalance = bchjs.BitcoinCash.toBitcoinCash(satBalance)

    return bchBalance
  } catch (err) {
    console.error('Error in getBCHBalance: ', err)
    console.log(`addr: ${addr}`)
    throw err
  }
}

// Returns the utxo with the biggest balance from an array of utxos.
async function findBiggestUtxo (utxos) {
  let largestAmount = 0
  let largestIndex = 0

  for (var i = 0; i < utxos.length; i++) {
    const thisUtxo = utxos[i]
    // console.log(`thisUTXO: ${JSON.stringify(thisUtxo, null, 2)}`);

    // Validate the UTXO data with the full node.
    const txout = await bchjs.Blockchain.getTxOut(thisUtxo.tx_hash, thisUtxo.tx_pos)
    if (txout === null) {
      // If the UTXO has already been spent, the full node will respond with null.
      console.log(
        'Stale UTXO found. You may need to wait for the indexer to catch up.'
      )
      continue
    }

    if (thisUtxo.value > largestAmount) {
      largestAmount = thisUtxo.value
      largestIndex = i
    }
  }

  return utxos[largestIndex]
}
