function init_insert() {
/*
for (var i = 1; i < 255; i++) {
	setTimeout(function() {
		$("body").css("background","rgba("+i+","+i+","+i+",1)");
	}, i*0.5+i);
}*/
var search = "Windows";
$("body").append("<div style='position:fixed;bottom:0;right:0;z-index:1000;width:10%;height:10%;background:red;' id='injected_div'>Injected<input type='text' id='search_input' /><button id='search_button'><img src='http://192.168.1.45:2013/img/-SOURCE-/lightbulb.png'></button></div><style>.highlight { background: yellow; color: red; border: 1px solid blue; }</style>");
//$("#injected_div").click(function() {
//	$(this).animate({width:"100%",height:"100%"}, 2000,function() {
//		setTimeout(function() {
//			$("#injected_div").animate({width:"10%",height:"10%"}, 2000);
//		}, 7000);
//	});
//});
$("#search_button").click(function() {
	var search = $("#search_input").val();
	console.log(search);
	$("div").highlight(search);
//    var foundin = $('*:contains("'+search+'")');
//    foundin.each(function(i,elem) {
//    	//var in_html = $(elem).html();
//    	//in_html.indexOf(search)
//    	$(elem).css({"color":"red"});
//    	console.log(elem);
//    });
});
console.log("megy?");



}

init_insert();
	
function text_highlight(dt) {
	$("p").highlight(dt);	
}