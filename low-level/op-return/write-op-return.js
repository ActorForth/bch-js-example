/*
  Generates and broadcasts a BCH transaction which includes an OP_RETURN
  including text data in the transaction.
*/

// You can generate a WIF (private key) and public address using the
// 'get-key' command of slp-cli-wallet.
const WIF = 'cSABRgrvqXoesQiCNBcj17JzswcDNQKbQe8JhtiPRevW84jUaqrn'
// const ADDR = 'bitcoincash:qr9jqgjlx2fqldyy2pj8nmxr0vuu59k0wsumalhexa'

const NETWORK = 'testnet'
// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
// TODO test with bitcoin.com

// Customize the message you want to send
const MESSAGE = 'fuck yeah'

const BCHJS = require('@chris.troutner/bch-js')
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
else bchjs = new BCHJS({ restURL: TESTNET_API_FREE })


async function writeOpReturn (msg, wif) {
  try {
    // Create an EC Key Pair from the user-supplied WIF.
    const ecPair = bchjs.ECPair.fromWIF(wif)

    // Generate the public address that corresponds to this WIF.
    const addr = bchjs.ECPair.toCashAddress(ecPair)
    console.log(`Publishing "${msg}" to ${addr}`)

    // Pick a UTXO controlled by this address.
    const utxoData = await bchjs.Electrumx.utxo(addr)
    const utxos = utxoData.utxos
    console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

    const utxo = await findBiggestUtxo(utxos)
    console.log('findBiggestUtxo UTXO', utxo)

    // instance of transaction builder
    const transactionBuilder = new bchjs.TransactionBuilder('testnet')
    console.log('TRANSACTIONBUILDER', transactionBuilder)

    const originalAmount = utxo.value
    console.log('ORIGINALAMOUNT', originalAmount)
    const vout = utxo.tx_pos
    console.log('VOUT', vout)
    const txid = utxo.tx_hash
    console.log('TXID', txid)

    // add input with txid and index of vout
    transactionBuilder.addInput(txid, vout)
    console.log('TRANSACTIONBUILDER', transactionBuilder)

    // TODO: Compute the 1 sat/byte fee.
    const fee = 500

    // BEGIN - Construction of OP_RETURN transaction.

    // Add the OP_RETURN to the transaction.

    let locktimeBip62 = 'c808f05c' //slpjs.Utils.get_BIP62_locktime_hex(locktime);

let redeemScript = BITBOX.Script.encode([
  Buffer.from(locktimeBip62, 'hex'),
  opcodes.OP_CHECKLOCKTIMEVERIFY,
  opcodes.OP_DROP,
  Buffer.from(pubkey, 'hex'),
  opcodes.OP_CHECKSIG
])

    const script = [
      Buffer.from(locktimeBip62, 'hex'),
      bchjs.Script.opcodes.OP_CHECKLOCKTIMEVERIFY,
      bchjs.Script.opcodes.OP_DROP, // Makes message comply with the memo.cash protocol.
      Buffer.from(pubkey, 'hex')
    ]

    // Compile the script array into a bitcoin-compliant hex encoded string.
    const data = bchjs.Script.encode(script)
    console.log('DATA', data)

    // Add the OP_RETURN output.
    transactionBuilder.addOutput(data, 0)
    console.log('TRANSACTIONBUILDER 0', transactionBuilder)

    // END - Construction of OP_RETURN transaction.

    // Send the same amount - fee.
    transactionBuilder.addOutput(addr, originalAmount - fee)
    console.log('TRANSACTIONBUILDER 1', transactionBuilder)

    // Sign the transaction with the HD node.
    let redeemScript
    transactionBuilder.sign(
      0,
      ecPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      originalAmount
    )

    // build tx
    const tx = transactionBuilder.build()
    console.log('TX', tx)

    // output rawhex
    const hex = tx.toHex()
    console.log('HEX', hex)
    // console.log(`TX hex: ${hex}`);
    // console.log(` `);

    // Broadcast transation to the network
    const txidStr = await bchjs.RawTransactions.sendRawTransaction(hex)
    console.log(`Transaction ID: ${txidStr}`)
    console.log(`https://memo.cash/post/${txidStr}`)
    console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)
  } catch (err) {
    console.log('Error in writeOpReturn(): ', err)
  }
}
writeOpReturn(MESSAGE, WIF)

// Returns the utxo with the biggest balance from an array of utxos.
async function findBiggestUtxo (utxos) {
  if (!Array.isArray(utxos)) throw new Error('utxos needs to be an array')

  let largestAmount = 0
  let largestIndex = 0

  for (var i = 0; i < utxos.length; i++) {
    const thisUtxo = utxos[i]

    if (thisUtxo.value > largestAmount) {
      // Ask the full node to validate the UTXO. Skip if invalid.
      const isValid = await bchjs.Blockchain.getTxOut(
        thisUtxo.tx_hash,
        thisUtxo.tx_pos
      )
      if (isValid === null) continue

      largestAmount = thisUtxo.value
      largestIndex = i
    }
  }

  return utxos[largestIndex]
}
