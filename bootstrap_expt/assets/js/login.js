$("#tab-bsin").click(function(){
	$("#tab-signin").show()
	$("#tab-signup").hide()
	$("#tab-bsin").addClass("active")
	$("#tab-bsup").removeClass("active")
})

$("#tab-bsup").click(function(){
  $("#tab-signin").hide()
  $("#tab-signup").show()
  $("#tab-bsin").removeClass("active")
  $("#tab-bsup").addClass("active")
})

$(".user-logout").click(function(){
    window.location.href = "/";
})
