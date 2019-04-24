/**
 * Web service that accepts a routecode and retrieves data from
 * the DB
 */

 //Parameters
 //?routecode=&stopno=&shipmentid=

//Printer Declaration
var pdfMake = require('pdfmake');
var pdfMakePrinter = require('pdfmake/src/printer'); 
var fs = require('fs');
var path = require('path');
var base64Img = require('base64-img');
var dt = pjs.require('converttoMDY.js');
var tm = pjs.require('convertTime.js');

function MAJMRetrievePOD(req, res) {

var query = require('url').parse(req.url,true).query;

var routeCode = query.routecode || "";
var stopNo = Number(query.stopno) || 0;
var shipID = query.shipmentid.substr(0,10) || "";

var xOrder = "";
var grpID = 0;

pjs.define("stopNum",  { type: "packed", length:  3, decimals: 0 });
pjs.define("routeCd", {type: "char", length: 30});

if (shipID != null || shipID != "") {
	xOrder = shipID.substr(0,8);
	grpID = Number(shipID.substr(8,2));	
}


var loadId = query.loadid || "";
if(loadId!=''){
	//getAllShipments();
}
function getAllShipments(){	
	var shipID='1280126102';
	var xOrder = shipID.substr(0,8);
	var grpID = Number(shipID.substr(8,2));	
	var loadId='VT1870271';//TEST PARAMETER
	var notempty='34';
	var xOrders = pjs.query("SELECT MDTXORD AS XORDER, MDTGRID AS GROUPID FROM EHP004 WHERE MDTMNID = ? ", [loadId]);
	res.set('content-type','text/plain');	
}



//System Reference Table Define
pjs.defineTable("eml10001", {keyed: true, read:true});
pjs.defineTable("aal00201", {keyed: true, read:true});

var ordInfoSourceRes;

//SQL to pull Data

if (shipID != "") {
	ordInfoSourceRes = pjs.query("SELECT CSMANAM AS CLIENTNAME, ORHCLID AS CLIENTCODE, ORHCORD AS ORDERNO,\
	CASE WHEN ORHOTYP = 'DL' THEN 'Delivery' \
		 WHEN ORHOTYP = 'RT' THEN 'Pickup' END AS ORDERTYPE, \
	SHHXORD||'-'||DIGITS(SHHGRID) AS SHIPMENT, DTEDTTY||'-'||BCDDESC AS SERVICETYPE, \
	CASE WHEN ORHOTYP = 'DL' THEN SHHDSTN ELSE SHHORGN END AS SITE, \
	ORHCNAM AS CONSIGNEE, ORHCAD1 AS CONSAD1, ORHCCTY AS CONSCITY, ORHSTTE AS CONSSTATE, ORHCZIP AS CONSZIP, \
	ORHCPPH AS CONSPHONE, COALESCE(RHDRTDT,0) AS ROUTEDATE, DIGITS(RSSTWST) AS TWS, \
	DIGITS(RSSTWEN) AS TWE, DIGITS(RSSATA) AS ATA, DIGITS(RSSATD) AS ATD, SHDSKU AS SKUCODE, \
	CASE WHEN SKMLDES <> '' THEN SKMLDES ELSE SKMDESC END AS SKUDESC, \
	CASE WHEN RSSSTAT IN ('Delivered','Partially Delivered') \
	AND ORHOTYP = 'DL' AND MSTFINF = 'Y' THEN 'Delivered' \
	WHEN RSSSTAT IN ('Delivered','Partially Delivered') AND ORHOTYP = 'RT' AND MSTFINF = 'Y' THEN 'Picked Up' \
	WHEN RSSSTAT IN ('Refused','Partially Delivered') AND \
	ORHOTYP IN ('DL','RT') AND MSTFINF = 'N' THEN 'Refused' \
	WHEN RSSSTAT = 'Delivery Exception' AND MSTFINF = 'N' THEN 'Delivery Exception' \
	ELSE ' ' END AS SKUSTATUS, \
	RSSSTAT AS SHIPSTATUS, \
	COALESCE(RHDRTCD,'') AS ROUTE, COALESCE(RHDRTDT,0) AS DELDATE, COALESCE(RSSSTNO,0) AS STOPNO, COALESCE(TABAD1,'') AS RETREASON \
	FROM EOL00102 \
	INNER JOIN EOL00201 ON SHHXORD = ORHXORD \
	INNER JOIN EOL00301 ON SHDXORD = SHHXORD AND SHDGRID = SHHGRID \
	LEFT OUTER JOIN EOL01001 ON DTEXORD = SHHXORD AND DTEGRID = SHHGRID \
	LEFT OUTER JOIN EBL00104 ON BCDCLID = ORHCLID AND BCDDTYP = DTEDTTY AND BCDDTYP <> ' '  \
	LEFT OUTER JOIN EML00902 ON SKMCLID = SHDCLID AND SKMSKID = SHDSKU \
	LEFT OUTER JOIN EHL00407 ON MDTXORD = SHHXORD AND MDTGRID = SHHGRID AND MDTMNID LIKE '000%' \
	LEFT OUTER JOIN EML00101 CLT ON CLT.CSMACCD = ORHCLID AND CLT.CSMCLAS = 'C' \
	LEFT OUTER JOIN EHL00301 ON MHDMNID = MDTMNID \
	LEFT OUTER JOIN EHL01801 ON RHDRTCD = MHDDCCD \
	LEFT OUTER JOIN EHL01902 ON RDTRTCD = RHDRTCD AND RDTXORD = SHHXORD AND RDTGRID = SHHGRID \
	LEFT OUTER JOIN EHL02002 ON RSSRTCD = RDTRTCD AND RSSSTNO = RDTSTNO \
	LEFT OUTER JOIN EHL02104 ON MSTRTCD = RHDRTCD AND SHDISKU = MSTISKU AND MSTXORD = SHHXORD AND MSTGRID = SHHGRID \
	LEFT OUTER JOIN EML10001 ON TABAK1 = MSTRESN AND TABKEY IN ('EXPREASON','RETREASON') \
	WHERE SHHXORD = ? AND SHHGRID = ?", [xOrder, grpID]);
} else if(loadId!=''){

	var xOrders = pjs.query("SELECT MDTXORD AS XORDER, MDTGRID AS GROUPID FROM EHP004 WHERE MDTMNID = ? ", [loadId]);
   
    var whereClauseTextArray=[];
    var whereClauseValueArray=[];

    var whereClauseText='';
    var whereClauseValue='';

    for (var xCount=0;xCount<xOrders.length;xCount++){
        whereClauseTextArray.push('(SHHXORD = ? AND SHHGRID = ?)');
        whereClauseValueArray.push(xOrders[xCount].xorder);
        whereClauseValueArray.push(xOrders[xCount].groupid);
    }

    whereClauseText=whereClauseTextArray.join(' OR ');
    whereClauseText='('+whereClauseText+')';
    whereClauseValue=whereClauseValueArray.join(', ');

    ordInfoSourceRes = pjs.query("SELECT CSMANAM AS CLIENTNAME, ORHCLID AS CLIENTCODE, ORHCORD AS ORDERNO,\
	CASE WHEN ORHOTYP = 'DL' THEN 'Delivery' \
		 WHEN ORHOTYP = 'RT' THEN 'Pickup' END AS ORDERTYPE, \
	SHHXORD||'-'||DIGITS(SHHGRID) AS SHIPMENT, DTEDTTY||'-'||BCDDESC AS SERVICETYPE, \
	CASE WHEN ORHOTYP = 'DL' THEN SHHDSTN ELSE SHHORGN END AS SITE, \
	ORHCNAM AS CONSIGNEE, ORHCAD1 AS CONSAD1, ORHCCTY AS CONSCITY, ORHSTTE AS CONSSTATE, ORHCZIP AS CONSZIP, \
	ORHCPPH AS CONSPHONE, COALESCE(RHDRTDT,0) AS ROUTEDATE, DIGITS(RSSTWST) AS TWS, \
	DIGITS(RSSTWEN) AS TWE, DIGITS(RSSATA) AS ATA, DIGITS(RSSATD) AS ATD, SHDSKU AS SKUCODE, \
	CASE WHEN SKMLDES <> '' THEN SKMLDES ELSE SKMDESC END AS SKUDESC, \
	CASE WHEN RSSSTAT IN ('Delivered','Partially Delivered') \
	AND ORHOTYP = 'DL' AND MSTFINF = 'Y' THEN 'Delivered' \
	WHEN RSSSTAT IN ('Delivered','Partially Delivered') AND ORHOTYP = 'RT' AND MSTFINF = 'Y' THEN 'Picked Up' \
	WHEN RSSSTAT IN ('Refused','Partially Delivered') AND \
	ORHOTYP IN ('DL','RT') AND MSTFINF = 'N' THEN 'Refused' \
	WHEN RSSSTAT = 'Delivery Exception' AND MSTFINF = 'N' THEN 'Delivery Exception' \
	ELSE ' ' END AS SKUSTATUS, \
	RSSSTAT AS SHIPSTATUS, \
	COALESCE(RHDRTCD,'') AS ROUTE, COALESCE(RHDRTDT,0) AS DELDATE, COALESCE(RSSSTNO,0) AS STOPNO, COALESCE(TABAD1,'') AS RETREASON \
	FROM EOL00102 \
	INNER JOIN EOL00201 ON SHHXORD = ORHXORD \
	INNER JOIN EOL00301 ON SHDXORD = SHHXORD AND SHDGRID = SHHGRID \
	LEFT OUTER JOIN EOL01001 ON DTEXORD = SHHXORD AND DTEGRID = SHHGRID \
	LEFT OUTER JOIN EBL00104 ON BCDCLID = ORHCLID AND BCDDTYP = DTEDTTY AND BCDDTYP <> ' '  \
	LEFT OUTER JOIN EML00902 ON SKMCLID = SHDCLID AND SKMSKID = SHDSKU \
	LEFT OUTER JOIN EHL00407 ON MDTXORD = SHHXORD AND MDTGRID = SHHGRID AND MDTMNID LIKE '000%' \
	LEFT OUTER JOIN EML00101 CLT ON CLT.CSMACCD = ORHCLID AND CLT.CSMCLAS = 'C' \
	LEFT OUTER JOIN EHL00301 ON MHDMNID = MDTMNID \
	LEFT OUTER JOIN EHL01801 ON RHDRTCD = MHDDCCD \
	LEFT OUTER JOIN EHL01902 ON RDTRTCD = RHDRTCD AND RDTXORD = SHHXORD AND RDTGRID = SHHGRID \
	LEFT OUTER JOIN EHL02002 ON RSSRTCD = RDTRTCD AND RSSSTNO = RDTSTNO \
	LEFT OUTER JOIN EHL02104 ON MSTRTCD = RHDRTCD AND SHDISKU = MSTISKU AND MSTXORD = SHHXORD AND MSTGRID = SHHGRID \
	LEFT OUTER JOIN EML10001 ON TABAK1 = MSTRESN AND TABKEY IN ('EXPREASON','RETREASON') \
    WHERE " +whereClauseText+" ", whereClauseValueArray);
        
} else {
	ordInfoSourceRes = pjs.query("SELECT CSMANAM AS CLIENTNAME, ORHCLID AS CLIENTCODE, ORHCORD AS ORDERNO,\
	CASE WHEN ORHOTYP = 'DL' THEN 'Delivery' \
		 WHEN ORHOTYP = 'RT' THEN 'Pickup' END AS ORDERTYPE, \
	SHHXORD||'-'||DIGITS(SHHGRID) AS SHIPMENT, DTEDTTY||'-'||BCDDESC AS SERVICETYPE, \
	CASE WHEN ORHOTYP = 'DL' THEN SHHDSTN ELSE SHHORGN END AS SITE, \
	ORHCNAM AS CONSIGNEE, ORHCAD1 AS CONSAD1, ORHCCTY AS CONSCITY, ORHSTTE AS CONSSTATE, ORHCZIP AS CONSZIP, \
	ORHCPPH AS CONSPHONE, RHDRTDT AS ROUTEDATE, DIGITS(RSSTWST) AS TWS, \
	DIGITS(RSSTWEN) AS TWE, DIGITS(RSSATA) AS ATA, DIGITS(RSSATD) AS ATD, SHDSKU AS SKUCODE, \
	CASE WHEN SKMLDES <> '' THEN SKMLDES ELSE SKMDESC END AS SKUDESC, \
	CASE WHEN RSSSTAT IN  ('Delivered','Partially Delivered') \
	AND ORHOTYP = 'DL' AND MSTFINF = 'Y' THEN 'Delivered' \
	WHEN RSSSTAT IN ('Delivered','Partially Delivered') AND ORHOTYP = 'RT' AND MSTFINF = 'Y' THEN 'Picked Up' \
	WHEN RSSSTAT IN ('Refused','Partially Delivered') AND \
	ORHOTYP IN ('DL','RT') AND MSTFINF = 'N' THEN 'Refused' \
	WHEN RSSSTAT = 'Delivery Exception' AND MSTFINF = 'N' THEN 'Delivery Exception' \
	ELSE ' ' END AS SKUSTATUS, \
	RSSSTAT AS SHIPSTATUS, RHDRTCD AS ROUTE,RHDRTDT AS DELDATE, RSSSTNO AS STOPNO, TABAD1 AS RETREASON \
	FROM EHL01801 \
	INNER JOIN EHL01901 ON RDTRTCD = RHDRTCD \
	INNER JOIN EHL02002 ON RSSRTCD = RDTRTCD AND RSSSTNO = RDTSTNO \
	INNER JOIN EOL00201 ON SHHXORD = RDTXORD AND SHHGRID = RDTGRID \
	INNER JOIN EOL00301 ON SHDXORD = SHHXORD AND SHDGRID = SHHGRID \
	INNER JOIN EOL00102 ON ORHXORD = SHHXORD \
	LEFT OUTER JOIN EOL01001 ON DTEXORD = SHHXORD AND DTEGRID = SHHGRID \
	LEFT OUTER JOIN EBL00104 ON BCDCLID = ORHCLID AND BCDDTYP = DTEDTTY AND BCDDTYP <> ' '	\
	LEFT OUTER JOIN EML00902 ON SKMCLID = SHDCLID AND SKMSKID = SHDSKU \
	LEFT OUTER JOIN EHL00407 ON MDTXORD = SHHXORD AND MDTGRID = SHHGRID AND MDTMNID LIKE '000%' \
	LEFT OUTER JOIN EML00101 CLT ON CLT.CSMACCD = ORHCLID AND CLT.CSMCLAS = 'C' \
	LEFT OUTER JOIN EHL02501 ON MTRMNID = MDTMNID \
	LEFT OUTER JOIN EHL02104 ON MSTRTCD = MTRRTCD AND SHDISKU = MSTISKU AND MSTXORD = SHHXORD AND MSTGRID = SHHGRID \
	LEFT OUTER JOIN EML10001 ON TABAK1 = MSTRESN AND TABKEY IN ('EXPREASON','RETREASON') \
	WHERE RSSRTCD = ? AND RSSSTNO = ?", [routeCode, stopNo]);
}


var shipmentGroup=[];
for(var recInc=0;recInc<ordInfoSourceRes.length;recInc++){ 
	if(shipmentGroup.indexOf(ordInfoSourceRes[recInc].shipment)<0){
		shipmentGroup.push(ordInfoSourceRes[recInc].shipment);  
		shipmentGroup[ordInfoSourceRes[recInc].shipment]=[];  
	}
	shipmentGroup[ordInfoSourceRes[recInc].shipment].push(ordInfoSourceRes[recInc]);
}

/*
shipmentGroup.forEach(function(eachShipmentId) {
    ordInfoSource=shipmentGroup[eachShipmentId];
        console.log(ordInfoSource);      
        
});
*/

//orderInfoData - Order Information

if (shipmentGroup != null && shipmentGroup.length > 0) {
	var globalPdfBodyContent=[];
	shipmentGroup.forEach(function(eachShipmentId) {
		ordInfoSource=shipmentGroup[eachShipmentId];
		//for(var shipRec=0;shipRec<ordInfoSource.length;shipRec++){ // All shipments looping for pdf pages
		if (ordInfoSource != null && ordInfoSource.length > 0) {
		
			var clientcode 	= ordInfoSource[0].clientcode;
			var clientname	= ordInfoSource[0].clientname;
			var ordernum	= ordInfoSource[0].orderno;
			var ordertype	= ordInfoSource[0].ordertype;
			var shipmentid	= ordInfoSource[0].shipment;
			var servicetype	= ordInfoSource[0].servicetype;
			var barcodeShipId = "*"+shipmentid.substr(0,8)+shipmentid.substr(9,2)+"*";

			var referencenum = "";
			var xorder = shipmentid.substr(0,8);
			pjs.defineTable("eol00401", {keyed: true, read: true}); //Order Reference Table Definiion

			aal00201.getRecord([clientcode, 'DTSCHREFNO']);
			if (aal00201.found()) {
				eol00401.getRecord([xorder, tabak2.trim()]);
				if (eol00401.found()) {
					referencenum = orrrefr.trim();
				}
			}

			//Site Info
			pjs.defineTable("eml01201", {keyed: true, read: true}); //Hub Master Table Definition
			eml01201.getRecord(ordInfoSource[0].site);
			if (eml01201.found()) {
				var sitename	= hbmname;
				var sitead1		= hbmadr1;
				var sitecity	= hbmcity;
				var sitestate	= hbmstte;
				var sitezip		= hbmzip;
			}

			var consname	= ordInfoSource[0].consignee;
			var consad1		= ordInfoSource[0].consad1;
			var conscity	= ordInfoSource[0].conscity;
			var consstate	= ordInfoSource[0].consstate;
			var conszip		= ordInfoSource[0].conszip;

			var consphone = "";
			if (ordInfoSource[0].consphone != 0)
			consphone	= formatPhoneNumber(ordInfoSource[0].consphone);

			var deliverydate = "";
			if (ordInfoSource[0].deldate != 0)
			deliverydate= dt.converttoMDY(ordInfoSource[0].deldate);
			route		= ordInfoSource[0].route;
			stopno		= ordInfoSource[0].stopno;
			routeCd		= ordInfoSource[0].route;
			stopNum		= ordInfoSource[0].stopno;

			var timewindow = ""
			if (ordInfoSource[0].tws != null || ordInfoSource[0].twe != null) {
				timewindow	= ordInfoSource[0].tws.substr(0,2)+":"+ordInfoSource[0].tws.substr(2,2)+" - "+ordInfoSource[0].twe.substr(0,2)+":"+ordInfoSource[0].twe.substr(2,2);
			}

			var actualtime = "";
			if (ordInfoSource[0].ata != null || ordInfoSource[0].atd != null) {
				actualtime	= ordInfoSource[0].ata.substr(0,2)+":"+ordInfoSource[0].ata.substr(2,2)+" - "+ordInfoSource[0].atd.substr(0,2)+":"+ordInfoSource[0].atd.substr(2,2);
			}


			var orderInfoData = [];
			var ordInfoRec = [];

			//Row 1
			ordInfoRec.push({text: 'Client:', style: 'label'});
			ordInfoRec.push({text: clientname, style: 'data'});
			ordInfoRec.push({text: 'Order #:', style: 'label'});
			ordInfoRec.push({text: ordernum, style: 'data'});

			orderInfoData.push(ordInfoRec);
			ordInfoRec = [];

			//Row 2
			ordInfoRec.push({text: 'Order Type:', style: 'label'});
			ordInfoRec.push({text: ordertype, style: 'data'});
			ordInfoRec.push({text: 'Reference #:', style: 'label'});
			ordInfoRec.push({text: referencenum , style: 'data'});

			orderInfoData.push(ordInfoRec);
			ordInfoRec = [];

			//Row 3
			ordInfoRec.push({text: 'Shipment:', style: 'label'});
			ordInfoRec.push({text: shipmentid, style: 'data'});
			ordInfoRec.push({text: 'Service:', style: 'label'});
			ordInfoRec.push({text: servicetype, style: 'data'});

			orderInfoData.push(ordInfoRec);
			ordInfoRec = [];

			//Row 4
			ordInfoRec.push({text: 'Delivery Site:', style: 'label'});
			ordInfoRec.push({text: sitename + "\n"+
									sitead1 + "\n"+
									sitecity.trim() + ", " + sitestate.trim() + " "+ sitezip.trim(), style: 'data'});
			ordInfoRec.push({text: 'Consignee:', style: 'label'});
			ordInfoRec.push({text: consname + "\n"+
									consad1 + "\n"+
									conscity.trim() +", "+ consstate.trim() +" "+conszip.trim()+"\n"+
									consphone, style: 'data'});

			orderInfoData.push(ordInfoRec);
			ordInfoRec = [];

			//Row 5
			ordInfoRec.push({text: 'Delivery Date:', style: 'label'});
			ordInfoRec.push({text: deliverydate, style: 'data'});
			ordInfoRec.push({text: 'Time Window:', style: 'label'});
			ordInfoRec.push({text: timewindow, style: 'data'});

			orderInfoData.push(ordInfoRec);
			ordInfoRec = [];

			//Row 6
			ordInfoRec.push({text: 'Route:', style: 'label'});
			ordInfoRec.push({text: route, style: 'data'});
			ordInfoRec.push({text: 'Actual:', style: 'label'});
			ordInfoRec.push({text: actualtime, style: 'data'});

			orderInfoData.push(ordInfoRec);
			ordInfoRec = [];

			//Row 6
			//Row 7
			ordInfoRec.push({text: ''});
			ordInfoRec.push({text: ''});
			ordInfoRec.push({text: 'Shipment:', style: 'label'});
			ordInfoRec.push({text: barcodeShipId, style: 'barcode1'});

			orderInfoData.push(ordInfoRec);
			ordInfoRec = [];

			//bodyData - Piece Level Information

			var bodyData = [];
			var headerRow = [];
				
			headerRow.push({text: 'SKU Code', style: 'skuheader'});
			headerRow.push({text: 'Description', style: 'skuheader'});
			headerRow.push({text: 'Status', style: 'skuheader'});

			bodyData.push(headerRow);

			ordInfoSource.forEach(function(sourceRow) {
				
				var skuRows = [];

				skuRows.push({text: sourceRow.skucode, style: 'skudetail'});
				skuRows.push({text: sourceRow.skudesc, style: 'skudetail'});
				skuRows.push({text: sourceRow.skustatus, style: 'skudetail'});
				
				bodyData.push(skuRows);
				
			});

			//orderStatus

			var status = ordInfoSource[0].shipstatus;

			var orderStatus = [];
			orderStatus.push({text: 'Order Status:', style: 'label2'});
			orderStatus.push({text: status, style: 'data2'});

			//returnReason

			var retreason = ordInfoSource[0].retreason;

			var returnReason = [];
			returnReason.push({text: 'Return Reason:', style: 'label2'});
			returnReason.push({text: retreason, style: 'data2'});

			//driverNotes

			var drvnotes = "";
							
			if (routeCd != null && routeCd != "") {
				pjs.defineTable("ehl02201", {keyed: true, read: true});
				//Retrieve Driver Notes from DB
				var driverData = pjs.query("select sfpval from ehl02201 where spfrtcd = ? and \
								spfstno = ? and sfpqual = 'DRVNOTE'", [routeCd, stopNum]);
				if (driverData != null && driverData.length > 0) {
					for (i=0; i<driverData.length; i++) {
						drvnotes = drvnotes + driverData[i].sfpval +"\n";
					}
				}
			}

			var driverNotes = [];
			driverNotes.push({text: 'Driver Notes:', style: 'label2'});
			driverNotes.push({text: drvnotes, style: 'data2'});

			//Retrieve Service Feedback Questions from DB
			var sfq1 = "";
			var sfq2 = "";
			var sfq3 = "";
			var sfq4 = "";
			var custcomment = "";

			if (routeCd != null && routeCd != "") {
				//Feeback Question 1
				ehl02201.getRecord([routeCd, stopNum, 'SFB01']);
				if (ehl02201.found()) {
					sfq1 = sfpval;
				}

				//Feedback Question 2
				ehl02201.getRecord([routeCd, stopNum, 'SFB02']);
				if (ehl02201.found()) {
					sfq2 = sfpval;
				}

				//Feedback Question 3
				ehl02201.getRecord([routeCd, stopNum, 'SFB03']);
				if (ehl02201.found()) {
					sfq3 = sfpval;
				}

				//Feedback Question 4
				ehl02201.getRecord([routeCd, stopNum, 'SFB04']);
				if (ehl02201.found()) {
					sfq4 = sfpval;
				}

				//Customer Comments
				ehl02201.getRecord([routeCd, stopNum, 'SFBCM']);
				if (ehl02201.found()) {
					custcomment = sfpval;
				}
			}

			var custCommentData = [];
			custCommentData.push({text: custcomment, style: 'data2'});

			//serviceFeedback

			var serviceFeedback = [];
			serviceFeedback.push({text: 'Was your merchandise delivered free of damage? ' + sfq1, style: 'label2'});
			serviceFeedback.push({text: 'Was your carton/packaging free of damage? ' + sfq2, style: 'label2'});
			serviceFeedback.push({text: 'Was the delivery completed free of property damage? ' + sfq3, style: 'label2'});
			serviceFeedback.push({text: 'If applicable, was used/old bedding removed? ' + sfq4, style: 'label2'});
			serviceFeedback.push({text: 'Customer Comments ', style: 'label2'});
			serviceFeedback.push({
				type: 'none',
				ul: custCommentData
			});

			//printName

			var prtname = ""
			var sigdate = "";

			if (routeCd != null && routeCd != "") {
				pjs.defineTable("ehl02002", {keyed: true, read: true});
				ehl02002.getRecord([routeCd, stopNum]);
				if (ehl02002.found()) {
					prtname = rsssnam;
					sigdate = dt.converttoMDY(rsssdat);
				}
			}

			var printName = [];
			printName.push({text: 'Print Name:', style: 'label2'});
			printName.push({text: prtname, style: 'data2'});

			//signDate

			var signDate = [];
			signDate.push({text: 'Sign Date:', style: 'label2'});
			signDate.push({text: sigdate, style: 'data2'});

			//custSign

			//Get File Path
			var signpath = "";

			eml10001.getRecord(['IMGPATH','SIGN']);
			if (eml10001.found()) {
				signpath = tabad1.trim();
			}

			var base64sign = "";
			var signfname = "";
			var signFullPath = "";

			if (route != null && route != "") {
				//Get Signature Filename
				ehl02201.getRecord([route, stopno, 'SIGFNAM']);
				if (ehl02201.found()) {
					signfname = sfpval.trim();
					signFullPath = signpath.trim()+signfname.trim();
					if (fs.existsSync(signFullPath)) {
						base64sign = base64Img.base64Sync(signpath+signfname);
					}
				}
			}

			if (base64sign != null && base64sign != "") {
				var custSignData = 
				{
					image: base64sign,
					width: 160,
					height: 35,
					margin: [0, 15, 0, 15]
				};
			} else {
				if (signfname.trim() != "") {
					var custSignData = 
					{
						text: "\nCustomer Signature is not accessible due to a system issue. Delivery details are accurate and customer signature was obained at time of delivery (or pick-up).\n",
						style: 'data'
					}
				} else {
					var custSignData = 
					{
						text: "\nStop was not completed through the Mobile App. Please reach out to Billing or Customer Service for proof of delivery.\n",
						style: 'data'
					};
				}
				
			}


			globalPdfBodyContent.push(
				{
					//Header Table with Ryder Logo and Header / Sub-Header
					table: {
						widths: ['auto', '*'],
						heights: 10,
						body: [
							//Row 1
							[
								//Ryder Logo -- Replace Image Source
								{
								image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKoAAAApCAMAAACSjELGAAAAUVBMVEX////OESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESYTR+l/AAAAGnRSTlMAECAwPEBMUFhgZGZwcYCCkJSgsMDM0Njg8FERMKAAAATcSURBVHgBvZmBlqwmDIYDNrW0NqWQWuH9H7QT1kjmSq96t9vvnD2DGMafEBLGhUcs9M6CHu6g9ghfzTRTjgDg6pkV4RJU4y+V6kNaRVBCfeSJ+Xox1NTBF+HmtInMOO+PoDpigyuyrgB8DUEeUHJw9pFD4IptN0yfXGHKPKLUWnOAN8qPSfVquHx+10g8nijkh48UGDHflzqr4fTfxCUSlzeh7hwS1bqnKn/hjozweiHtJXFafA9x3QIUmSPN0EBqyCUm5nlizv7avUvawyo5OBOrgjZx/W16gdXv4NLejL3vBWbjDulQM3LNbkqUY7y57Ylbdgqn5WK75EnbKxmpPYNO58AmAJFjSGbPzWsVgCj5O1KJCZ26t7SLTk9PFLdDqQ9GalINrowS8KTDlNBXZ909H/K8IVzSnhTH7h0XgORg6lK9Lq3nga13m8rqMTGfPD8Ff1NpAoO61/eaY9lm623scYfax6EbH7dDryZAT0tfL0arG0WvHxUAXYJVH+NUlMtHq+eN7FW+WSLdAIqHO+DFiWKrI7zZw6Rec2YmR3tRO4spK1tADHCL7fsF3dUh2CMjllMATjYpjOY62ai/S1A3jDHxn3AudZChtBNt0u9tX8/0UGa4T9YdOMbEP46rgZJsIejt9ZgRd3pQINynXkjt8e8kPBV/imL/JrWHLY7OV+vz86GmxHwxlfatVjfolULWk+Cz9gc0BpEbCfpS3EYDrjgYY+L/JJVqpzh7ezXOno5kjNnIf34+9H3OQ4IphlaL7rh+d1wtyiDbrUA/dD68GNSjc7LRycbjPeYGm511Rp3V9bICT9BRZax1fVtyq8BeVvxmDVYdR71XexxAeZ6q7PeMtbISm49ZMdnB7sr5o6AsuoG4falPu7aSF2e/NcAjtkPrDM9wZVDCPaIb2eIL+CRYD7KDJ8SeqP4notmvT5LHZBOVeV30/XgjCvCGR1mHCXGCa1LtbOG2Z9kkKkGFXyWceK7cbfvyWVjkKQ60KiX6Z/txew8kvoq2+TTjFWAYRoR143EMKOviH+wp7G+oEhH9QkTeExFCSMzRtUWfc1AjTyxtlJseqMiPNnFWRsDY+lBG5whhiudfsbM+WFkJAR4naHUcNkm8e3ltB8Wg6ycpZ5KWtLF2QtojKLcBBGNcqieY0D1KekXyL4qSVUZLMIl+k9COyhBeN+WRf9bO7xLI/TD+77kTuQ4o/N0Xvw6dtuyhz8sDS62L9GLbAKRGWW7SJttLboq2Ns8s80jS9/PHAA/wTKwq5kQvZmxIMzJv5kiG9tS01LrOWl9J3Gx2Fe4O3HiPEgYvY7z2/dqyygVTKvUZi805QVIkvvSvr3bUqM8vBcbISRz/oS74yF4yLTxSSrOCS1zI9QGbzTlFPbfJDUlCuBDNWz8j5P21wCZ/7Wbz80duldjGQDTLSKkJ/oba+75FUFrOebGfBINIjdL7W/e9XLJkuSTLLgEaliaVJZJ4zxaLGEAPguuXg2u9Yk3L+SUswF5reV/7trjfGMmu2LKYJTH24hoW4/i6+knmNj07d2MgHu80Zgo4rF38IZX050yZ5NP8UBdVSc0DpOMFRtY++ZyCxNNjPCLqUWRBHIcQ9n9RyYfsioVb6QlEizGamUmmxsxpAvDEMcAcmfCjD5sV4HGs+Qea7SatRgGX5gAAAABJRU5ErkJggg==',
								width: 160,
								height: 35,
								}, 
								
								//Header and Sub-header
								{
								stack: [
									'Ryder Last Mile',
									{text: 'Proof of Delivery / Pickup', style: 'subheader'},
									],
								style: 'header'
								}
							]
					]
					},
					layout: 'noBorders'
				}, //End of Header Table
				
				//Horizontal line below Header
				{
					canvas: 
					[{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 2, styles: 'boldline'}],
					styles: 'boldline'
				},
				
				//Order Information Subheader
				{
					text: 'Order Information', style: 'subtitle',
				},
				
				//Order Information
				{
					table: {
						widths: [75, 160, 75, '*'],
						body: orderInfoData
					},
					layout: 'noBorders'
				}, //End of Order Information
				
				//Horizontal line below Order Information
				{
					canvas: 
					[{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 2, styles: 'boldline'}],
					styles: 'boldline'
				},
				
				//SKU Details Subtitle
				{
					text: 'Delivery Item Details', style: 'subtitle',
				},
				
				//SKU Details
				{
					style: 'skudetail',
					table: {
						widths: [100, 300, '*'],
						headerRows: 1,
						body: bodyData
					},
				},
				
				//Delivery Information Subtitle
				{
					text: 'Delivery Information', style: 'subtitle',
				},
				
				//Order Status
				{
					columns: orderStatus
				},
				
				//Return Reason, if available
				{
					columns: returnReason
				},
				
				//Driver Notes, if available
				{
					columns: driverNotes
				},
				
				//Service Feedback Subtitle
				{
					text: 'Service Feedback', style: 'subtitle',
				},
				
				//Service Feedback Responses
				{
					type: 'square',
					ul: serviceFeedback
				},
				
				//Customer consent
				{
					text: 'Customer Consent', style: 'subtitle',
				},
				
				{
					text: 'I hereby accept that all items were delivered / picked up as noted in the receipt. ' +
					'I also accept to have the below entered signature applied on the delivery receipts for the individual shipments ' +
					'and pieces delivered / picked up as part of the order.', style: 'data2'
				},
				
				//Customer Signature -- Replace Image Source
				custSignData,
				
				//Signed By Name
				{
					columns: printName
				},
				
				//Sign Date
				{
					columns: signDate
				}
			);

	} // If Loop Ends
});	//Main Object Loop


// Final rendering part started

//Define Data starts
var docDefinition = {
    pageOrientation: 'portrait',
	content: globalPdfBodyContent,	
	footer: 
	function(page, pages) { 
    return { 
        columns: [
            { 
                alignment: 'center',
                text: [
                    { text: page.toString(), italics: true },
                    ' of ',
                    { text: pages.toString(), italics: true }
                ]
            }
        ],
        margin: [0, 15, 0, 15]
    };
},
	
	styles: {
	    header: {
			fontSize: 22,
			bold: true,
			alignment: 'right',
			color: '#76777B',
			margin: [0, 5, 0, 5]
	    },
	    
	    subheader: {
	        fontSize: 14,
	        bold: true
		},
		
		barcode1: {
			font: 'Barcode',
	        fontSize: 30,
			margin: [0, 1, 0, 1]
	    },
	    
	    subtitle: {
	        fontSize: 12,
	        bold: true,
	        color: '#CE1126',
	        margin: [0, 5, 0, 5]
	    },
	    
	    boldline: {
	        color: '#76777B',
	        margin: [0, 3, 0, 3]
	    },
	    
	    label: {
	        fontSize: 9,
	        bold: true,
	        color: '#000000',
	        margin: [0, 1, 0 ,1]
	    },
	    
	    label2: {
	        fontSize: 10,
	        bold: true,
	        color: '#000000',
	        margin: [0, 1, 0, 1]
	    },
	    
	    data: {
	        fontSize: 9,
	        bold: false,
	        color: '#76777B',
	        margin: [0, 1, 0, 1]
	    },
	    
	    data2: {
	        fontSize: 10,
	        bold: false,
	        color: '#76777B',
	        margin: [0, 1, 0, 1]
	    },
	    
	    skuheader: {
	        fontsize: 12,
	        bold: true,
	        color: '#000000',
	        alignment: 'center',
	        fillColor: '#D6D6D6',
	        margin: [0, 2, 0, 2]
	    },
	    
        skudetail: {
	        fontsize: 9,
	        bold: false,
	        alignment: 'left',
	        color: '#76777B',
	        margin: [0, 2, 0, 2]
	    },
	}
}; //Define Data ends


} else {
		//Define Data
var docDefinition = {
    pageOrientation: 'portrait',
	content: [

	    //Header Table with Ryder Logo and Header / Sub-Header
	    {
	        table: {
	            widths: ['auto', '*'],
	            heights: 10,
	            body: [
	                //Row 1
	                [
	                    //Ryder Logo -- Replace Image Source
	                    {
    	                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKoAAAApCAMAAACSjELGAAAAUVBMVEX////OESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESbOESYTR+l/AAAAGnRSTlMAECAwPEBMUFhgZGZwcYCCkJSgsMDM0Njg8FERMKAAAATcSURBVHgBvZmBlqwmDIYDNrW0NqWQWuH9H7QT1kjmSq96t9vvnD2DGMafEBLGhUcs9M6CHu6g9ghfzTRTjgDg6pkV4RJU4y+V6kNaRVBCfeSJ+Xox1NTBF+HmtInMOO+PoDpigyuyrgB8DUEeUHJw9pFD4IptN0yfXGHKPKLUWnOAN8qPSfVquHx+10g8nijkh48UGDHflzqr4fTfxCUSlzeh7hwS1bqnKn/hjozweiHtJXFafA9x3QIUmSPN0EBqyCUm5nlizv7avUvawyo5OBOrgjZx/W16gdXv4NLejL3vBWbjDulQM3LNbkqUY7y57Ylbdgqn5WK75EnbKxmpPYNO58AmAJFjSGbPzWsVgCj5O1KJCZ26t7SLTk9PFLdDqQ9GalINrowS8KTDlNBXZ909H/K8IVzSnhTH7h0XgORg6lK9Lq3nga13m8rqMTGfPD8Ff1NpAoO61/eaY9lm623scYfax6EbH7dDryZAT0tfL0arG0WvHxUAXYJVH+NUlMtHq+eN7FW+WSLdAIqHO+DFiWKrI7zZw6Rec2YmR3tRO4spK1tADHCL7fsF3dUh2CMjllMATjYpjOY62ai/S1A3jDHxn3AudZChtBNt0u9tX8/0UGa4T9YdOMbEP46rgZJsIejt9ZgRd3pQINynXkjt8e8kPBV/imL/JrWHLY7OV+vz86GmxHwxlfatVjfolULWk+Cz9gc0BpEbCfpS3EYDrjgYY+L/JJVqpzh7ezXOno5kjNnIf34+9H3OQ4IphlaL7rh+d1wtyiDbrUA/dD68GNSjc7LRycbjPeYGm511Rp3V9bICT9BRZax1fVtyq8BeVvxmDVYdR71XexxAeZ6q7PeMtbISm49ZMdnB7sr5o6AsuoG4falPu7aSF2e/NcAjtkPrDM9wZVDCPaIb2eIL+CRYD7KDJ8SeqP4notmvT5LHZBOVeV30/XgjCvCGR1mHCXGCa1LtbOG2Z9kkKkGFXyWceK7cbfvyWVjkKQ60KiX6Z/txew8kvoq2+TTjFWAYRoR143EMKOviH+wp7G+oEhH9QkTeExFCSMzRtUWfc1AjTyxtlJseqMiPNnFWRsDY+lBG5whhiudfsbM+WFkJAR4naHUcNkm8e3ltB8Wg6ycpZ5KWtLF2QtojKLcBBGNcqieY0D1KekXyL4qSVUZLMIl+k9COyhBeN+WRf9bO7xLI/TD+77kTuQ4o/N0Xvw6dtuyhz8sDS62L9GLbAKRGWW7SJttLboq2Ns8s80jS9/PHAA/wTKwq5kQvZmxIMzJv5kiG9tS01LrOWl9J3Gx2Fe4O3HiPEgYvY7z2/dqyygVTKvUZi805QVIkvvSvr3bUqM8vBcbISRz/oS74yF4yLTxSSrOCS1zI9QGbzTlFPbfJDUlCuBDNWz8j5P21wCZ/7Wbz80duldjGQDTLSKkJ/oba+75FUFrOebGfBINIjdL7W/e9XLJkuSTLLgEaliaVJZJ4zxaLGEAPguuXg2u9Yk3L+SUswF5reV/7trjfGMmu2LKYJTH24hoW4/i6+knmNj07d2MgHu80Zgo4rF38IZX050yZ5NP8UBdVSc0DpOMFRtY++ZyCxNNjPCLqUWRBHIcQ9n9RyYfsioVb6QlEizGamUmmxsxpAvDEMcAcmfCjD5sV4HGs+Qea7SatRgGX5gAAAABJRU5ErkJggg==',
    			        width: 160,
    			        height: 35,
	                    }, 
	                    
	                    //Header and Sub-header
	                    {
	                    stack: [
	                        'Ryder Last Mile',
	                        {text: 'Return Label', style: 'subheader'},
	                        ],
	                    style: 'header'
	                    }
	                ]
	           ]
	        },
	        layout: 'noBorders'
	    }, //End of Header Table
	    
	    //Horizontal line below Header
	    {
	        canvas: 
    	    [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 2, styles: 'boldline'}],
    	    styles: 'boldline'
	    },
	    
	    //Order Information
	    {
	        stack: [
				{text: 'No data to retrieve POD for the Route Stop or Shipment ID. Please ensure that the route has been saved correctly.', style: 'subheader'},
				],
	    }, //End of Order Information
	    
	    //Horizontal line below Order Information
	    {
	        canvas: 
    	    [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 2, styles: 'boldline'}],
    	    styles: 'boldline'
	    },
	],
	
	footer: 
	function(page, pages) { 
    return { 
        columns: [
            { 
                alignment: 'center',
                text: [
                    { text: page.toString(), italics: true },
                    ' of ',
                    { text: pages.toString(), italics: true }
                ]
            }
        ],
        margin: [0, 15, 0, 15]
    };
},
	
	styles: {
	    header: {
			fontSize: 22,
			bold: true,
			alignment: 'right',
			color: '#76777B',
			margin: [0, 5, 0, 5]
	    },
	    
	    subheader: {
	        fontSize: 14,
	        bold: true
	    },
	    
	    subtitle: {
	        fontSize: 12,
	        bold: true,
	        color: '#CE1126',
	        margin: [0, 5, 0, 5]
		},
		
		subdata: {
			fontSize: 12,
			bold: true,
			color: '#000000',
			margin: [0, 2, 0, 2]
		},
	    
	    boldline: {
	        color: '#76777B',
	        margin: [0, 3, 0, 3]
	    },
	    
	    label: {
	        fontSize: 9,
	        bold: true,
	        color: '#000000',
	        margin: [0, 1, 0 ,1]
	    },
	    
	    label2: {
	        fontSize: 10,
	        bold: true,
	        color: '#000000',
	        margin: [0, 1, 0, 1]
	    },
	    
	    data: {
	        fontSize: 9,
	        bold: false,
	        color: '#76777B',
	        margin: [0, 1, 0, 1]
	    },
	    
	    data2: {
	        fontSize: 10,
	        bold: false,
	        color: '#76777B',
	        margin: [0, 1, 0, 1]
	    },
	    
	    skuheader: {
	        fontsize: 12,
	        bold: true,
	        color: '#000000',
	        alignment: 'center',
	        fillColor: '#D6D6D6',
	        margin: [0, 2, 0, 2]
	    },
	    
        skudetail: {
	        fontsize: 9,
	        bold: false,
	        alignment: 'left',
	        color: '#76777B',
	        margin: [0, 2, 0, 2]
	    },
	}
};
}

createPdfBinary(docDefinition, function(binary) {
	res.set('content-type','application/pdf');
	res.set('content-disposition','inline; filename=ryderpod.pdf');
    res.send(binary);
  }, function(error) {
    res.send('ERROR:' + error);
  });

  
//Function to create PDF Binary

function createPdfBinary(pdfDoc, callback) {

  var fontDescriptors = {
    Roboto: {
      normal: path.join(__dirname, '..', 'examples', '/fonts/Roboto-Regular.ttf'),
      bold: path.join(__dirname, '..', 'examples', '/fonts/Roboto-Medium.ttf'),
      italics: path.join(__dirname, '..', 'examples', '/fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(__dirname, '..', 'examples', '/fonts/Roboto-MediumItalic.ttf')
    },

	Barcode: {
		normal: path.join(__dirname, '..', 'examples', '/fonts/fre3of9x.ttf'),
	}
  };

  var printer = new pdfMakePrinter(fontDescriptors);

  var doc = printer.createPdfKitDocument(pdfDoc);

  var chunks = [];
  var result;

  doc.on('data', function (chunk) {
    chunks.push(chunk);
  });
  doc.on('end', function () {
    result = Buffer.concat(chunks);
    //callback('data:application/pdf;base64,' + result.toString('base64'));
	callback(result);
  });
  doc.end();

}

//Function to format Phone Number

function formatPhoneNumber(s) {
	var s2 = (""+s).replace(/\D/g, '');
	var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
	return (!m) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];
  }


}

exports.run = MAJMRetrievePOD;	