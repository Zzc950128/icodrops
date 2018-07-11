const superagent = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs')

const activeUrl = {
	id: 0,
	url: "https://icodrops.com/category/active-ico/"
}
const upcomingUrl = {
	id: 1,
	url: "https://icodrops.com/category/upcoming-ico/"
}
const endedUrl = {
	id: 2,
	url: "https://icodrops.com/category/ended-ico/"
}

let activeData = []
let upcomingData = []
let endedData = []

function start() {
	console.log("start")
	let urls = [activeUrl, upcomingUrl, endedUrl]
	urls.forEach(function(item, index, arr) {
		setTimeout(function() {
			get(item)
		}, index*2000);
	})
}

function get(item) {
	superagent
		.get(item.url)
		.timeout({
			response: 5000,
			deadline: 60000
		})
		.end(function(err, res) {
			if(err) {
				console.log("get error: " + item.url)
			}
			let $ = cheerio.load(res.text)
			for(let i = 0; i < $('.a_ico').length / 2; i++) {
				let data = $("#n_color").eq(i).attr('href')
				if(item.id == 0) {
					activeData.push(data)
				}else if(item.id == 1) {
					upcomingData.push(data)
				}else {
					endedData.push(data)
				}
				console.log("get success: " + i)
				if(i == $('.a_ico').length / 2) {
					console.log("start write")
					write(item.id)
				}
			}
		})
}

function write(id) {
	let data
	if(id == 0) {
		data = activeData
	}else if(id == 1) {
		data = upcomingData
	}else {
		data = endedData
	}
	fs.writeFile(__dirname + '/data/' + id + '.json', JSON.stringify({
		data: data
	}), function(err) {
		if(err) {
			console.log("write error: " + id)
		}
		console.log("write over: " + id)
	})
}

start()