const superagent = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs')

const activeUrl = {
	id: 0,
	name: "active",
	url: "https://icodrops.com/category/active-ico/"
}
const upcomingUrl = {
	id: 1,
	name: "upcoming",
	url: "https://icodrops.com/category/upcoming-ico/"
}
const endedUrl = {
	id: 2,
	name: "ended",
	url: "https://icodrops.com/category/ended-ico/"
}

let activeList = []
let upcomingList = []
let endedList = []

function replaceText(text){
    return text.replace(/\n/g, "").replace(/\s/g, "");
}

function start() {
	console.log("start")
	let urls = [activeUrl, upcomingUrl, endedUrl]
	urls.forEach(function(item, index, arr) {
		setTimeout(function() {
			get(item)
		}, index*2000)
	})
}

function get(item) {
	console.log("get " + item.name + "List")
	superagent
		.get(item.url)
		.timeout({
			response: 5000,
			deadline: 60000
		})
		.end(function(err, res) {
			if(err) {
				console.log("get " + item.name + "error")
				return err
			}
			let $ = cheerio.load(res.text)
			let ico = $(".a_ico")
			for(let i = 0; i <= ico.length / 2; i++) {
				console.log("get start: " + i)
				let _this = ico.eq(i)
				let data = {
					id: i,
					href:  _this.find(".ico-main-info a").attr("href"),
					interest: replaceText(_this.find(".interest").children().text()),
					goal: _this.find("#categ_desctop .notset").length != 0 ? replaceText(_this.find("#categ_desctop .notset").text()) : replaceText(_this.find("#categ_desctop").text()),
					received: _this.find("#new_column_categ_invisted").length != 0 ? _this.find("#new_column_categ_invisted .notset") != 0  ? replaceText(_this.find("#new_column_categ_invisted .notset").text()) : replaceText(_this.find("#new_column_categ_invisted span").eq(0).text()) : '',
					rate: _this.find("#new_column_categ_invisted span").eq(1).length != 0 ? replaceText(_this.find("#new_column_categ_invisted span").eq(1).text()) : '',
					kyc: _this.find(".categ_one").length == 0 ? '' : _this.find(".categ_one").attr('title').split(":")[1].toLowerCase().trim(),
					whitelist: _this.find(".categ_three").length != 0 ? _this.find(".categ_three").attr('title').split(":")[1].toLowerCase().trim() : _this.find("#linkwhitelist").length != 0 ? _this.find("#linkwhitelist").attr('title').split(":")[1].toLowerCase().trim() : '',
					market: _this.find("#t_tikcer").length != 0 ? _this.find("#t_tikcer li").text().split(":")[1] : ''
				}
				if(item.id == 0) {
					activeList.push(data)
				}else if(item.id == 1) {
					upcomingList.push(data)
				}else {
					endedList.push(data)
				}
				if(i == ico.length / 2) {
					console.log("write start " + item.name)
					write(item)
				}
			}
		})
}

function write(item) {
	let data
	if(item.id == 0) {
		data = activeList
	}else if(item.id == 1) {
		data = upcomingList
	}else {
		data = endedList
	}
	fs.writeFile(__dirname + '/data/' + item.name + '.json', JSON.stringify({
		list: data
	}), function(err) {
		if(err) {
			console.log("write error " + item.name)
			return err
		}
		console.log('write over')
	})
}

start()