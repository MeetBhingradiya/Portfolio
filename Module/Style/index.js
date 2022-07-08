const Links = document.querySelectorAll('.li')
function ScrollEffect()
    {
        const navbar = document.getElementById('navigationbar');
        const navbarclass = document.getElementById('navigationbar').classList
        const TotalHeight = document.body.scrollHeight - window.innerHeight;
        window.onscroll = function NavbarEffect()
            {
                const ScrolledHeight = window.pageYOffset;
                const ScrolledDown = ScrolledHeight - 0;
                const ScrolledTop = ScrolledDown - ScrolledHeight;

                // if(ScrolledDown =)
            }
    }

/*===== Links Activator =====*/
function Activator(i)
    {
        for(Link of Links)
        Link.classList.remove('active');
        Links[i].classList.add('active');
    }
for (let j = 0;j<Links.length;j++)
    {
        Links[j].addEventListener('click',()=>{
            Activator(j);
        })
    }

const Right = ScrollReveal({
    origin: 'right',
    distance: '100px',
    duration: 2000,
    reset: true
});
const Left = ScrollReveal({
    origin: 'left',
    distance: '100px',
    duration: 2000,
    reset: true
});
const Top = ScrollReveal({
    origin: 'top',
    distance: '100px',
    duration: 2000,
    reset: true
});
// const Bottom = ScrollReveal({
//     origin: 'bottom',
//     distance: '100px',
//     duration: 2000,
//     reset: true
// });

Top.reveal('.Links',{delay: 200}); 
Top.reveal('.brand',{delay: 200}); 