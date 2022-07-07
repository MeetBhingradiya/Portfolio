///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
//                                                                                   //
//                                 MADE BY B.MEET                                    //
//                                                                                   //
//                            Scroolbar Module Javascript                            //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
let progress = document.getElementById('progressbar');
let height = document.body.scrollHeight - window.innerHeight;
window.onscroll = function()
{
let progressHeight = (window.pageYOffset / height) * 100;
progress.style.height = progressHeight+'%';
}