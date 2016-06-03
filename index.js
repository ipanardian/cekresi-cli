#!/usr/bin/env node
/**
*  Cek Resi CLI
*  (c) 2016 Ipan Ardian
*
*  A command line app to check tracking number 
*  For details, see the web site: https://github.com/ipanardian/cekresi-cli
*  Apache License 2.0
*/
'use strict'

if (process.argv.length <= 2) {
    console.log("Usage: cekresi-cli NOMOR_RESI");
    process.exit(-1);
}

var Horseman = require('node-horseman');
var cheerio = require('cheerio');
var tabletojson = require('tabletojson');
var Table = require('cli-table');
var colors = require('colors');
var Spinner = require('cli-spinner').Spinner
var param = process.argv[2];
var spinner = new Spinner('Checking... %s');
spinner.setSpinnerString(7);
spinner.start();

var horseman = new Horseman();
	horseman
	.userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.3")
	.on('error', function(message, trace) {
		console.log(message)
	})
	.on('timeout', function(message) {
		console.log('Timeout')
	})
	.open('http://cekresi.com/?noresi='+param)
	.click("#cekresi")
	.wait(2000)
	.waitForSelector('#results')
	.evaluate(function() {
		return document.querySelector('#results').innerHTML;
	})
	.then(function(result) {
		spinner.stop()
		var $ = cheerio.load(result)
		var infoExpedisi = $('h3.top_title').text();
		
		if (result != '' && infoExpedisi != '') {
			var tablesAsJson = tabletojson.convert(result)
			var infoTable = new Table({head: ['Informasi Pengiriman','','']});
			var statusTable = new Table({head: ['Tanggal','Lokasi','Keterangan']});

			console.log('\n==================== '+infoExpedisi.red+' =========================\n')
			for (let tr in tablesAsJson[0]){
				let row = []
				for (let td in tablesAsJson[0][tr]) {
					row.push(tablesAsJson[0][tr][td])
				}
				infoTable.push(row)
			}
			console.log(infoTable.toString())
			console.log('\n')

			for (let i = 1; i <= tablesAsJson.length - 1; i++) {
				for (let tr in tablesAsJson[i]) {
					let row = []
					for (let td in tablesAsJson[i][tr]) {
						row.push(tablesAsJson[i][tr][td])
					}
					statusTable.push(row)
				}
			}
			console.log(statusTable.toString())
		}
		else {
			console.log('\nMaaf no resi yang anda masukkan sementara tidak dapat kami proses')
		}
		console.log('\nFor details: https://github.com/ipanardian/cekresi-cli')
	})
	.close();