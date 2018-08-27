// Reload Appt & TX table every 5s
var tableRefr = setInterval(reloadDiv, 5000)

function reloadDiv() {
  //console.log(window.location.pathname)
  $("#apptTable")
    .load(window.location.pathname +
      " #apptDash table")
  $("#txTable")
    .load(window.location.pathname +
      " #txDash table")
}

// Add BTN Check
if ($("#userType").text() == 'Physician') {
  $("#btnAdd").show()
  $("#btnAddAppt").show()
}

// Open TX Page
$(window).click(function(e) {
  loadTxID(e)
})
$(window).on('touchstart click', function(e) {
  loadTxID(e)
})

function loadTxID(e) {
  if (e.target.className.slice(0, 6) == "report") {
    var id = e.target.className.slice(6)
    $(".modal").addClass("modal-show")
    $("#modal-target").load(window.location.pathname + "tx/" + id + " #target")
    //console.log(window.location.pathname + "tx/" + id + " #target")
  }
}

// Open Add Page
$("#btnAdd").click(function(e) {
  $(".modal").addClass("modal-show")
  $("#modal-target").load(window.location.pathname + "addTx/ #target")
})

$("#btnAddAppt").click(function(e) {
  $(".modal").addClass("modal-show")
  $("#modal-target").load("/appt.html #target")
})

// Close Modal
$(window).click(function(e) {
  closeModal(e)
})

$(window).on('touchstart click', function(e) {
  closeModal(e)
})

function closeModal(e) {
  if (e.target.className == "modal modal-show" ||
    e.target.className == "close") {
    $(".modal").removeClass("modal-show")
  }
}
