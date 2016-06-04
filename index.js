#!/usr/bin/env node
/**
*  Cek Resi CLI
*  (c) 2016 Ipan Ardian
*
*  A command line app to tracking AWB number 
*  For details, see the web site: https://github.com/ipanardian/cekresi-cli
*  The MIT License
*/
'use strict'

const VERSION = 'v1.0.6'

if (process.argv.length <= 2) {
    console.log("Usage: cekresi-cli AWB_NUMBER")
    process.exit(-1)
}

var param = process.argv[2]
if (param == '--version') {
	console.log(VERSION)
	process.exit(-1)
}
else if (param.length < 10 || !param.match(/^[a-z0-9]+$/i)) {
	console.log('Invalid AWB Number')
	process.exit(-1)
}

var Horseman = require('node-horseman')
var cheerio = require('cheerio')
var tabletojson = require('tabletojson')
var Table = require('cli-table')
var colors = require('colors')
var Spinner = require('cli-spinner').Spinner
var spinner = new Spinner('Checking... %s ')
spinner.setSpinnerString(7)
spinner.start()

var horseman = new Horseman()
	horseman
	.userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.3")
	.on('error', function(message, trace) {
		console.log(message)
	})
	.on('timeout', function(message) {
		console.log('Timeout\n')
	})
	.open('http://cekresi.com/?noresi='+param)
	.click("#cekresi")
	.waitFor(function(selector) {
		return $(selector).is(':visible')
	}, '#results', true)
	.evaluate(function() {
		return document.querySelector('#results').innerHTML
	})
	.then(function(result) {
		cekresi.load(result).parse()
	})
	.finally(function() {
	    horseman.close()
	    spinner.stop()
	    return
	})

var cekresi = {
	result: null,
	tablesAsJson: null,
	infoExpedisi: null,
	el: null,
	checkResult() {
		return (this.result != '' && this.infoExpedisi != '' ? true:false)
	},
	load(res) {
		this.parseHTML(res)
		this.result = res
		this.infoExpedisi = this.el('h3.top_title').text()
		return this
	},
	parseHTML(html) {
		this.el = cheerio.load(html)
	},
	parseDeliveryInfo() {
		var deliveryTable = new Table()
		for (let tr in this.tablesAsJson[0]){
			let row = []
			for (let td in this.tablesAsJson[0][tr]) {
				row.push(this.tablesAsJson[0][tr][td])
			}
			deliveryTable.push(row)
		}
		print(deliveryTable.toString())
	},
	parseActivityInfo() {
		let header = []
		let body = []
		for (let i = 1; i <= this.tablesAsJson.length - 1; i++) {
			for (let tr in this.tablesAsJson[i]) {
				let row = []
				for (let td in this.tablesAsJson[i][tr]) {
					if (body.length < 1) 
						header.push(td)

					row.push(this.tablesAsJson[i][tr][td])
				}
				body.push(row)
			}
		}
		var activityTable = new Table({head: header})
		for (let item in body) {
			activityTable.push(body[item])
		}
		print(activityTable.toString())
	},
	parse() {
		if (this.checkResult()) {
			this.tablesAsJson = tabletojson.convert(this.result)
			print('\n==================== '+ this.infoExpedisi.yellow +' =========================\n')
			this.parseDeliveryInfo()
			print('')
			this.parseActivityInfo()
		}
		else {
			print('\nMaaf no resi yang anda masukkan sementara tidak dapat kami proses'.yellow)
		}
		print('\nFor details: https://github.com/ipanardian/cekresi-cli')
	}
}

function print(msg) {
	console.log(msg)
}