$(document).ready(function () {
    $("#submit").click(function () {
      sendCanvas();
    });
 });

 var canvas;
 var context;
 var clear = true;
 var sent = false;
 window.onload = function () {

   // Definitions
   canvas = document.getElementById("paint-canvas");
   context = canvas.getContext("2d");
   var boundings = canvas.getBoundingClientRect();
 
   // Specifications
   var mouseX = 0;
   var mouseY = 0;
   context.strokeStyle = 'black'; // initial brush color
   context.lineWidth = 1; // initial brush width
   var isDrawing = false;
 
   // Mouse Down Event
   canvas.addEventListener('mousedown', function(event) {
     setMouseCoordinates(event);
     isDrawing = true;
     clear = false;
     sent = false;
 
     // Start Drawing
     context.beginPath();
     context.moveTo(mouseX, mouseY);
   });
 
   // Mouse Move Event
   canvas.addEventListener('mousemove', function(event) {
     setMouseCoordinates(event);
 
     if(isDrawing){
       context.lineTo(mouseX, mouseY);
       context.stroke();
       sendCanvas();
     }
   });
 
   // Mouse Up Event
   canvas.addEventListener('mouseup', function(event) {
     setMouseCoordinates(event);
     isDrawing = false;
   });
 
   // Handle Mouse Coordinates
   function setMouseCoordinates(event) {
      mouseX = (event.clientX - boundings.left) / (boundings.right - boundings.left) * canvas.width;
      mouseY = (event.clientY - boundings.top) / (boundings.bottom - boundings.top) * canvas.height;
   }
 
   // Handle Clear Button
   var clearButton = document.getElementById('clear');
 
   clearButton.addEventListener('click', function() {
      clear = true;
     context.clearRect(0, 0, canvas.width, canvas.height);
     for (let i = 0; i < 10; i++){
      $("#guess"+i).css('color', 'black');
      $("#guess"+i).html(i+": [---]");
    }
   });
 };


 function sendCanvas(){
      var canvasData =  canvas.toDataURL();
      $.post("http://localhost:3000/request",
      {
         dataUrl: canvasData,
      },
      function (data, status) {
          results = data.response;
          var maxValue = 0;
          var maxIndex = -1;
          for (let i = 0; i < 10; i++){
            $("#guess"+i).css('color', 'black');
            $("#guess"+i).html(i+": "+results[i]);
            if (results[i] > maxValue){
              maxValue = results[i];
              maxIndex = i;
            }
          }
          $("#guess"+maxIndex).css('color', 'red');
      });
  }
 
  setInterval(sendCanvas, 1000);
 