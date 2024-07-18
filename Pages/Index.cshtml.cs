using LibreOfficeLibrary;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using PdfToSvg;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using ShapeCrawler;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using System.IO;
using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.ExtendedProperties;

namespace PPT2HTML.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            //Convert();
            Pack();
        }

        public void Pack()
        {
            var tempDir = "SCORM-" + DateTime.Now.Ticks;
            var baseInputDir = @"D:\Test\PPT2HTML\Data\SCORM\ScormDriver_scorm12";
            var baseOutputDir = @"D:\Test\PPT2HTML\Data\Temp\" + tempDir;

            CopyDir(baseInputDir, baseOutputDir);

        }

        private void CopyDir(string sourceDir, string targetDir)
        {
            Directory.CreateDirectory(targetDir);

            foreach (var file in Directory.GetFiles(sourceDir))
                System.IO.File.Copy(file, Path.Combine(targetDir, Path.GetFileName(file)));

            foreach (var directory in Directory.GetDirectories(sourceDir))
                CopyDir(directory, Path.Combine(targetDir, Path.GetFileName(directory)));
        }

        public void Convert(bool keepAnimation = true)
        {
            DocumentConverter cvt = new DocumentConverter();
            var format = "pdf";
            var sourceFileName = "slide1.pptx";
            var fileName = "slide1" + "." + format;
            var baseInputDir = @"D:\Test\PPT2HTML\Data\Input\";
            var baseOutputDir = @"D:\Test\PPT2HTML\Data\Output\slide1\";
            var outFile = baseOutputDir + fileName;

            CleanDir(baseOutputDir);

            if (keepAnimation)
            {
                SCSettings.CanCollectLogs = false;

                using (Stream fileStream = System.IO.File.Open(baseInputDir + sourceFileName, FileMode.Open))
                {
                    var memoryStream = new MemoryStream();
                    fileStream.CopyTo(memoryStream);
                    byte[] byteArray = memoryStream.ToArray();

                    memoryStream.Dispose();

                    //https://github.com/ShapeCrawler/ShapeCrawler/wiki/Examples
                    using var pres = SCPresentation.Open(fileStream);
                    var slidesCount = pres.Slides.Count;

                    for (var i = 0; i < slidesCount; i++)
                    {

                        var splitOutFile = baseOutputDir + "slide1-" + i + ".pptx";
                        //https://learn.microsoft.com/en-us/office/open-xml/working-with-animation
                        //https://learn.microsoft.com/en-us/office/open-xml/how-to-get-all-the-text-in-a-slide-in-a-presentation
                        //if (i != 2) continue;

                        /*pres.Slides[i].SDKSlidePart.Slide.CommonSlideData.InnerXml.Contains("cBhvr")
                            || pres.Slides[i].SDKSlidePart.Slide.CommonSlideData.InnerXml.Contains("timing")
                        || pres.Slides[i].SDKSlidePart.Slide.CommonSlideData.InnerXml.Contains(":tav ")
                         ||*/

                        //IEnumerable<Timing> animationTimings = pres.Slides[i].SDKSlidePart.Slide.Descendants<Timing>();
                        //foreach (Timing animationTiming in animationTimings)
                        //{
                        //    var x = animationTiming;
                        //}

                        //var hasHiddenShapes = pres.Slides[i].SDKSlidePart.Slide.Timing?.HasChildren;
                        //if (hasHiddenShapes == true)
                        {
                            MemoryStream stream = new MemoryStream(byteArray);
                            var newPres = SCPresentation.Open(stream);
                            if (newPres.Slides.Count > 0)
                            {
                                if (i > 0)
                                {
                                    newPres.Slides[i].Number = 1;
                                }

                                for (var j = newPres.Slides.Count - 1; j > 0; j--)
                                {
                                    newPres.Slides.Remove(newPres.Slides[j]);
                                }
                                //newPres.Save();
                                newPres.SaveAs(splitOutFile);
                                cvt.ConvertToFile(splitOutFile, splitOutFile.Replace(".pptx", ".svg"), format: "svg");
                                cvt.ConvertToFile(splitOutFile, splitOutFile.Replace(".pptx", ".png"), format: "png");
                                //Thread.Sleep(1000);
                                //ProcessAnim(splitOutFile.Replace(".pptx", ".svg"));

                                ClickCount(splitOutFile.Replace(".pptx", ".svg"));
                                System.IO.File.Delete(splitOutFile);
                            }
                            stream.Dispose();
                        }
                    };

                }
            }

            cvt.ConvertToFile(baseInputDir + sourceFileName, outFile, format: format);

            using (var doc = PdfDocument.Open(outFile))
            {
                var pageNo = 0;
                foreach (var page in doc.Pages)
                {
                    var splitOutFile = baseOutputDir + $"slide1-thumb-{pageNo++}.svg";

                    //if (!System.IO.File.Exists(splitOutFile))
                    page.SaveAsSvg(splitOutFile);
                }
            }
        }
        private void CleanDir(string path)
        {
            System.IO.DirectoryInfo di = new DirectoryInfo(path);

            foreach (FileInfo file in di.GetFiles())
            {
                file.Delete();
            }
            foreach (DirectoryInfo dir in di.GetDirectories())
            {
                dir.Delete(true);
            }
        }

        /// <summary>
        /// Đếm số click trong slide, thực hiện click qua js player
        /// </summary>
        /// <param name="filePath"></param>
        /// <returns></returns>
        private int ClickCount(string filePath)
        {
            StreamReader reader = new StreamReader(filePath);
            string input = reader.ReadToEnd();
            reader.Close();

            var count = input.Split("presentation:node-type=\"on-click\"").Length - 1;
            if (count > 0)
            {
                Console.WriteLine(filePath + "===> " + count);
            }
            return count;
        }

        private void ProcessAnim(string filePath)
        {
            StreamReader reader = new StreamReader(filePath);
            string input = reader.ReadToEnd();
            reader.Close();
            using (StreamWriter writer = new StreamWriter(filePath, false))
            {
                {
                    string output = input.Replace("presentation:node-type=\"on-click\"", "presentation:node-type=\"after-previous\"");
                    output = output.Replace("smil:begin=\"next\"", "smil:begin=\"0s\"");
                    writer.Write(output);
                }
                writer.Close();
            }

            /*
             <defs id="presentation-animations">
  <defs ooo:slide="id1" id="id1-animations" class="Animations">
   <anim:par smil:dur="indefinite" smil:restart="never" presentation:node-type="timing-root">
    <anim:seq smil:dur="indefinite" presentation:node-type="main-sequence">
     <anim:par smil:begin="next" smil:fill="hold">
      <anim:par smil:begin="0s" smil:fill="hold">
       <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="on-click" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-appear">
        <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id3" smil:attributeName="visibility" smil:to="visible"/>
       </anim:par>
      </anim:par>
     </anim:par>
    </anim:seq>
   </anim:par>
  </defs>
 </defs>


             <defs id="presentation-animations"> 
            <defs ooo:slide="id1" id="id1-animations" class="Animations">   
            <anim:par smil:dur="indefinite" smil:restart="never" presentation:node-type="timing-root">    
            <anim:par smil:begin="id1.begin">      <anim:transitionFilter smil:dur="0.75s" smil:type="fade" smil:subtype="crossfade"/> 
            </anim:par>     <anim:seq smil:dur="indefinite" presentation:node-type="main-sequence">   
            <anim:par smil:begin="0s" smil:fill="hold">       <anim:par smil:begin="0s" smil:fill="hold">   
            <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="with-previous" 
            presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-left">   
            <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id8" smil:attributeName="visibility" smil:to="visible"/>      
            <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id8" smil:attributeName="x" smil:values="0-width/2;x" smil:keyTimes="0;1"/>     
            <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id8" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/> 
            </anim:par>     
            <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="with-previous" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-left">      
            <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id9" smil:attributeName="visibility" smil:to="visible"/>    
            <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id9" smil:attributeName="x" smil:values="0-width/2;x" smil:keyTimes="0;1"/>       
            <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id9" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/>       
            </anim:par>       </anim:par>       <anim:par smil:begin="0.5s" smil:fill="hold">     
            <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="after-previous" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-right">         <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id10" smil:attributeName="visibility" smil:to="visible"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id10" smil:attributeName="x" smil:values="1+width/2;x" smil:keyTimes="0;1"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id10" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/>        </anim:par>       </anim:par>       <anim:par smil:begin="1s" smil:fill="hold">        <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="after-previous" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-right">         <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id11" smil:attributeName="visibility" smil:to="visible"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id11" smil:attributeName="x" smil:values="1+width/2;x" smil:keyTimes="0;1"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id11" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/>        </anim:par>       </anim:par>       <anim:par smil:begin="1.5s" smil:fill="hold">        <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="after-previous" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-left">         <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id12" smil:attributeName="visibility" smil:to="visible"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id12" smil:attributeName="x" smil:values="0-width/2;x" smil:keyTimes="0;1"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id12" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/>        </anim:par>       </anim:par>       <anim:par smil:begin="2s" smil:fill="hold">        <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="after-previous" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-left">         <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id13" smil:attributeName="visibility" smil:to="visible"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id13" smil:attributeName="x" smil:values="0-width/2;x" smil:keyTimes="0;1"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id13" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/>        </anim:par>       </anim:par>       <anim:par smil:begin="2.5s" smil:fill="hold">        <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="after-previous" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-right">         <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id14" smil:attributeName="visibility" smil:to="visible"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id14" smil:attributeName="x" smil:values="1+width/2;x" smil:keyTimes="0;1"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id14" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/>        </anim:par>       </anim:par>       <anim:par smil:begin="3s" smil:fill="hold">        <anim:par smil:begin="0s" smil:fill="hold" presentation:node-type="after-previous" presentation:preset-class="entrance" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-sub-type="from-right">         <anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="id15" smil:attributeName="visibility" smil:to="visible"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id15" smil:attributeName="x" smil:values="1+width/2;x" smil:keyTimes="0;1"/>         <anim:animate smil:dur="0.5s" smil:fill="hold" smil:targetElement="id15" smil:attributeName="y" smil:values="y;y" smil:keyTimes="0;1"/>        </anim:par>       </anim:par>      </anim:par>     </anim:seq>    </anim:par>   </defs>              </defs>  <defs>  

             */
            //presentation:node-type="on-click" ==> presentation:node-type="after-previous"
        }
    }
}