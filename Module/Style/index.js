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

const sr = ScrollReveal({
    origin: 'top',
    distance: '80px',
    duration: 2000,
    reset: true
});