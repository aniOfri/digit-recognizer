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
   });
 
   /*/ Handle Save Button
   var saveButton = document.getElementById('save');
 
   saveButton.addEventListener('click', function() {
     var imageName = prompt('Please enter image name');
     var canvasDataURL = canvas.toDataURL();
     var a = document.createElement('a');
     a.href = canvasDataURL;
     a.download = imageName || 'drawing';
     a.click();
   });*/
 };


 var CanvasToBMP = {

   /**
    * Convert a canvas element to ArrayBuffer containing a BMP file
    * with support for 32-bit (alpha).
    *
    * Note that CORS requirement must be fulfilled.
    *
    * @param {HTMLCanvasElement} canvas - the canvas element to convert
    * @return {ArrayBuffer}
    */
   toArrayBuffer: function(canvas) {
 
     var w = canvas.width,
         h = canvas.height,
         w4 = w * 4,
         idata = canvas.getContext("2d").getImageData(0, 0, w, h),
         data32 = new Uint32Array(idata.data.buffer), // 32-bit representation of canvas
 
         stride = Math.floor((32 * w + 31) / 32) * 4, // row length incl. padding
         pixelArraySize = stride * h,                 // total bitmap size
         fileLength = 122 + pixelArraySize,           // header size is known + bitmap
 
         file = new ArrayBuffer(fileLength),          // raw byte buffer (returned)
         view = new DataView(file),                   // handle endian, reg. width etc.
         pos = 0, x, y = 0, p, s = 0, a, v;
 
     // write file header
     setU16(0x4d42);          // BM
     setU32(fileLength);      // total length
     pos += 4;                // skip unused fields
     setU32(0x7a);            // offset to pixels
 
     // DIB header
     setU32(108);             // header size
     setU32(w);
     setU32(-h >>> 0);        // negative = top-to-bottom
     setU16(1);               // 1 plane
     setU16(32);              // 32-bits (RGBA)
     setU32(3);               // no compression (BI_BITFIELDS, 3)
     setU32(pixelArraySize);  // bitmap size incl. padding (stride x height)
     setU32(2835);            // pixels/meter h (~72 DPI x 39.3701 inch/m)
     setU32(2835);            // pixels/meter v
     pos += 8;                // skip color/important colors
     setU32(0xff0000);        // red channel mask
     setU32(0xff00);          // green channel mask
     setU32(0xff);            // blue channel mask
     setU32(0xff000000);      // alpha channel mask
     setU32(0x57696e20);      // " win" color space
 
     // bitmap data, change order of ABGR to BGRA
     while (y < h) {
       p = 0x7a + y * stride; // offset + stride x height
       x = 0;
       while (x < w4) {
         v = data32[s++];                     // get ABGR
         a = v >>> 24;                        // alpha channel
         view.setUint32(p + x, (v << 8) | a); // set BGRA
         x += 4;
       }
       y++
     }
 
     return file;
 
     // helper method to move current buffer position
     function setU16(data) {view.setUint16(pos, data, true); pos += 2}
     function setU32(data) {view.setUint32(pos, data, true); pos += 4}
   },
 
   /**
    * Converts a canvas to BMP file, returns a Blob representing the
    * file. This can be used with URL.createObjectURL().
    * Note that CORS requirement must be fulfilled.
    *
    * @param {HTMLCanvasElement} canvas - the canvas element to convert
    * @return {Blob}
    */
   toBlob: function(canvas) {
     return new Blob([this.toArrayBuffer(canvas)], {
       type: "image/bmp"
     });
   },
 
   /**
    * Converts the canvas to a data-URI representing a BMP file.
    * Note that CORS requirement must be fulfilled.
    *
    * @param canvas
    * @return {string}
    */
   toDataURL: function(canvas) {
     var buffer = new Uint8Array(this.toArrayBuffer(canvas)),
         bs = "", i = 0, l = buffer.length;
     while (i < l) bs += String.fromCharCode(buffer[i++]);
     return "data:image/bmp;base64," + btoa(bs);
   }
 };

 function sendCanvas(){
    console.log("Trying.. (CLEAR:"+clear+", SENT:"+sent+")")
   if (!clear && !sent){
      console.log("Sent!");

      var canvasData =  canvas.toDataURL(); //canvas.toDataURL("image/bmp");
      console.log(canvasData);
      $.post("http://localhost:3000/request",
      {
         dataUrl: canvasData,
      },
      function (data, status) {
         sent = true;
         console.log(data);
      });
   }
}

 
 