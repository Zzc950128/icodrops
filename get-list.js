const superagent = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs')

let activeData = fs.readFileSync(__dirname + '/data/active.json',"utf-8")
let upcomingData = fs.readFileSync(__dirname + '/data/upcoming.json',"utf-8")
let endedData = fs.readFileSync(__dirname + '/data/ended.json',"utf-8")

let activeList = JSON.parse(activeData).list
let upcomingList = JSON.parse(upcomingData).list
let endedList = JSON.parse(endedData).list

let activeDetail = []
let upcomingDetail = []
let endedDetail = []
let error = []

let count

function replaceText(text){
    return text.replace(/\n/g, "").replace(/\t/g, "");
}

function start(flag) {
	console.log("start " + flag)
	let list
	if(flag == 1) {
		count = 0
		list = upcomingList
	}else if(flag == 2) {
		count = 0
		list = endedList
	}else {
		count = 0
		list = activeList
	}
	list.forEach(function(item, index, arr) {
		setTimeout(function() {
			get(item, flag)
		}, index*2000)
	})
}

function get(item, flag) {
	let type
	if(flag == 1) {
		type = "upcoming"
	}else if(flag == 2) {
		type = "ended"
	}else {
		type = "active"
	}
	console.log("get " + type + " " + item.id)
	superagent
		.get(item.href)
		.retry(2)
		.timeout({
			response: 5000,
			deadline: 60000
		})
		.end(function(err, res) {
			if(err) {
				console.log("get " + type + " " + item.id + " error")
				// count++
				// let errorList = {
				// 	type: type,
				// 	id: item.id
				// }
				// error.push(errorList)
				get(item, flag)
				// return err
			}else {
				let $ = cheerio.load(res.text)
				let obj = {}
				let links = []
				for(let i = 0; i < $('.soc_links a').length; i++) {
					links.push($('.soc_links a').eq(i).attr('href'))
				}
				let list = []
				for(let i = 0; i < $('.fa-calendar').parent().parent().find('.list .col-md-6 li').length; i++) {
					list.push(replaceText($('.fa-calendar').parent().parent().find('.list .col-md-6 li').eq(i).text()))
				}
				let screenshots = []
				for(let i = 0; i < $('.fa-picture-o').parent().parent().find('.col-md-3 a').length; i++) {
					screenshots.push($('.fa-picture-o').parent().parent().find('.col-md-3 a').eq(i).attr('href'))
				}
				obj.id = item.id
				obj.status = type
				obj.href = item.href
				obj.name = replaceText($('.ico-main-info h3').eq(0).text())
				obj.industry = replaceText($('.ico-category-name').eq(0).text()).match(/\((.+)\)/)[1]
				obj.icon = $('.ico-icon').eq(0).find('img').attr('data-src')
				obj.about = replaceText($('.ico-description').eq(0).text())
				obj.website = $('.ico-right-col a').eq(0).attr('href') ? $('.ico-right-col a').eq(0).attr('href').split('?')[0] : ''
				obj.whitepaper = $('.ico-right-col a').eq(1).attr('href') ? $('.ico-right-col a').eq(1).attr('href').split('?')[0] : '',
				obj.media = $('.ico-media').children().children().attr('src') ? $('.ico-media').children().children().attr('src').split('?')[0] : $('.ico-media').children().children().attr('href').split('?')[0],
				obj.time = $(".fa-calendar").parent().find("h4").text() ? replaceText($(".fa-calendar").parent().find("h4").text().split(":")[1]) : ''
				obj.interest = item.interest
				obj.goal = item.goal
				obj.received = item.received
				obj.rate = item.rate
				obj.kyc = item.kyc
				obj.whitelist = item.whitelist
				obj.market = item.market
				obj.links = links
				obj.list = list
				obj.screenshots = screenshots
				count++
				if(flag == 0) {
					console.log("get " + type + " " + item.id + " over " + count)
					activeDetail.push(obj)
					if(count == activeList.length) {
						write(0)
						start(1)
					}
				}else if(flag == 1) {
					console.log("get " + type + " " + item.id + " over " + count)
					upcomingDetail.push(obj)
					if(count == upcomingList.length) {
						write(1)
						start(2)
					}
				}else {
					console.log("get " + type + " " + item.id + " over " + count)
					endedDetail.push(obj)
					if(count == endedList.length) {
						write(2)
						write(3)
					}
				}
			}
		})
}

function write(flag) {
	let data
	if(flag == 0) {
		data = activeDetail
	}else if(flag == 1) {
		data = upcomingDetail
	}else if(flag == 2) {
		data = endedDetail
	}else {
		data = error
	}
	fs.writeFile(__dirname + '/data/' + flag + '.json', JSON.stringify({
		data: data
	}), function(err) {
		if(err) {
			console.log("write error " + flag)
			return err
		}
		console.log('write over' + flag)
	})
}

start(2)