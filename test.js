let coinList = [`"KRW-BTC"`];
let change;
let rateShape;
let changeClass;
let changePrice;
let changeRate;
let price;
let coin;

const request = new XMLHttpRequest();
const url = 'https://api.upbit.com/v1/market/all';
request.open("GET", url, false);
request.send();
let allCoinList = JSON.parse(request.responseText);
let allKRWCoinList = [];
window.onload = function() {

	$("#refreshBtn").click(function() {
		location.reload();
	})
	for (let i = 0; i < allCoinList.length; i++) {
		if (allCoinList[i].market.split("-")[0] === "KRW") {
			allKRWCoinList.push(allCoinList[i]);
		}
	}
	let tempName1 = "";
	let tempName2 = "";
	let tempName3 = "";
	for (let i = 0; i < allKRWCoinList.length; i++) {
		if (i % 3 == 0) {
			tempName1 += `${allKRWCoinList[i].korean_name} : ${allKRWCoinList[i].market.split("-")[1]}<br>`;
		} else if (i % 3 == 1) {
			tempName2 += `${allKRWCoinList[i].korean_name} : ${allKRWCoinList[i].market.split("-")[1]}<br>`;
		} else {
			tempName3 += `${allKRWCoinList[i].korean_name} : ${allKRWCoinList[i].market.split("-")[1]}<br>`;
		}

	}
	$("#KRWCoinList1").html(tempName1);
	$("#KRWCoinList2").html(tempName2);
	$("#KRWCoinList3").html(tempName3);
	$("#showCoinList").click(function() {
		$("#KRWCoinListDiv").fadeToggle();
	})

	connectWS();


	$("#addCoinBtn").click(function() {
		closeWS();
		const addCoinInput = $("#addCoinInput");
		coinList.push(`"KRW-` + addCoinInput.val() + `"`);

		$("#coinTable").append(`<table class="coinList">
		<thead>
			<tr>
				<td colspan="2">${addCoinInput.val()}</td>
			</tr>
		</thead>
		<tr>
			<td>현재가격</td>
			<td class="currentPrice"><span id="current${addCoinInput.val()}"></span>
				<div>
					<span id="changePrice${addCoinInput.val()}"></span><span id="changeRate${addCoinInput.val()}"></span>
				</div></td>
		</tr>
	</table>`)

		addCoinInput.val("")

		setTimeout(function() {
			connectWS();
		}, 1000);
	});


}

let socket; // 소켓

// 웹소켓 연결
function connectWS() {

	if (socket != undefined) {
		socket.close();
	}

	socket = new WebSocket("wss://api.upbit.com/websocket/v1");
	socket.binaryType = 'arraybuffer';
	socket.onopen = function(e) {
		coinListString = `[${coinList.join(",")}]`;

		filterRequest(`[{ "ticket": "UNIQUE_TICKET" },
			{ "type": "ticker", "codes": ${coinListString} }]`);
		/*		filterRequest(`[{"ticket":"UNIQUE_TICKET"},
					{"type":"ticker","codes":["KRW-BTC"]},		
					{"type":"orderbook","codes":["KRW-BTC"]},
					{"type":"trade","codes":["KRW-BTC"]}]`);*/
	}
	socket.onclose = function(e) {
		socket = undefined;
	}
	socket.onmessage = function(e) {
		var enc = new TextDecoder("utf-8");
		var arr = new Uint8Array(e.data);
		var str_d = enc.decode(arr);
		var data = JSON.parse(str_d);
		console.log(data);

		change = data.change;

		coin = data.code.split("-")[1];

		//console.log(data);
		if (data.type == "ticker") { // 현재가 데이터
			if (change === "EVEN") {
				change = "";
				rateShape = "(-)";
				changeClass = "EVEN";
			} else if (change === "FALL") {
				change = "-"
				rateShape = "(▼)"
				changeClass = "FALL";
			} else {
				change = "+"
				rateShape = "(▲)"
				changeClass = "RISE";
			}
			changePrice = change + data.change_price.toLocaleString();
			changeRate = change + (data.change_rate * 100).toFixed(2);
			price = data.trade_price.toLocaleString();
			document.getElementById("current" + coin).innerHTML = price;
			document.getElementById("current" + coin).classList.add(changeClass);
			document.getElementById("changePrice" + coin).innerHTML = changePrice;
			document.getElementById("changePrice" + coin).classList.add(changeClass);
			document.getElementById("changeRate" + coin).innerHTML = changeRate + "%" + rateShape;
			document.getElementById("changeRate" + coin).classList.add(changeClass);
		}
		if (data.type == "orderbook") { // 호가 데이터
			// TODO
		}
		if (data.type == "trade") { // 체결 데이터
			// TODO
		}
	}
}
// 웹소켓 연결 해제
function closeWS() {
	if (socket != undefined) {
		socket.close();
		socket = undefined;
	}
}

// 웹소켓 요청
function filterRequest(filter) {
	if (socket == undefined) {
		alert('no connect exists');
		return;
	}
	socket.send(filter);
}

