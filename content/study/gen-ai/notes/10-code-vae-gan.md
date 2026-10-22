---
title: "10. Hands-on: VAE & GAN in PyTorch (MNIST)"
order: 10
---

## VAE

```python
import torch, torch.nn as nn, torch.nn.functional as F
from torchvision import datasets, transforms
loader = torch.utils.data.DataLoader(
    datasets.MNIST('.', train=True, download=True, transform=transforms.ToTensor()),
    batch_size=128, shuffle=True)

class VAE(nn.Module):
    def __init__(self, z_dim=20):
        super().__init__()
        self.fc1 = nn.Linear(784, 400)            # encoder
        self.fc_mu = nn.Linear(400, z_dim)        # mean
        self.fc_logvar = nn.Linear(400, z_dim)    # log variance
        self.fc3 = nn.Linear(z_dim, 400)          # decoder
        self.fc4 = nn.Linear(400, 784)
    def encode(self, x):
        h = F.relu(self.fc1(x)); return self.fc_mu(h), self.fc_logvar(h)
    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)               # randomness outside the network
        return mu + std * eps                     # z = mu + sigma * eps
    def decode(self, z):
        return torch.sigmoid(self.fc4(F.relu(self.fc3(z))))
    def forward(self, x):
        mu, logvar = self.encode(x.view(-1, 784))
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar

def vae_loss(x_hat, x, mu, logvar):
    recon = F.binary_cross_entropy(x_hat, x.view(-1, 784), reduction='sum')
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return recon + kl

model = VAE(); opt = torch.optim.Adam(model.parameters(), lr=1e-3)
for epoch in range(10):
    for x, _ in loader:
        x_hat, mu, logvar = model(x)
        loss = vae_loss(x_hat, x, mu, logvar)
        opt.zero_grad(); loss.backward(); opt.step()
    print(epoch, loss.item() / len(x))

# Generate NEW digits: sample from prior N(0, I) and decode
with torch.no_grad():
    z = torch.randn(16, 20)
    samples = model.decode(z).view(-1, 1, 28, 28)   # show with matplotlib / save_image
```

## GAN

```python
tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5,), (0.5,))])  # → [-1, 1]
loader = torch.utils.data.DataLoader(datasets.MNIST('.', train=True, download=True, transform=tf),
                                     batch_size=128, shuffle=True)
z_dim = 100
G = nn.Sequential(nn.Linear(z_dim, 256), nn.LeakyReLU(0.2),
                  nn.Linear(256, 512), nn.LeakyReLU(0.2),
                  nn.Linear(512, 784), nn.Tanh())             # fake image in [-1,1]
D = nn.Sequential(nn.Linear(784, 512), nn.LeakyReLU(0.2),
                  nn.Linear(512, 256), nn.LeakyReLU(0.2),
                  nn.Linear(256, 1), nn.Sigmoid())            # P(real)
bce = nn.BCELoss()
optG = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))
optD = torch.optim.Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))

for epoch in range(50):
    for real, _ in loader:
        b = real.size(0); real = real.view(b, -1)
        ones, zeros = torch.ones(b, 1), torch.zeros(b, 1)
        # ---- 1) train Discriminator: real -> 1, fake -> 0
        fake = G(torch.randn(b, z_dim))
        lossD = bce(D(real), ones) + bce(D(fake.detach()), zeros)
        optD.zero_grad(); lossD.backward(); optD.step()
        # ---- 2) train Generator: make D say 1 (non-saturating loss)
        lossG = bce(D(fake), ones)
        optG.zero_grad(); lossG.backward(); optG.step()
    print(f"epoch {epoch}  D={lossD.item():.3f}  G={lossG.item():.3f}")
    # save G(fixed_noise) every few epochs to show progress: noise -> blobs -> digits
```

**Tip:** **Explain in exam:** `fake.detach()` stops D's loss from updating G. Tanh output matches [−1,1] normalisation. Fixed noise vector is used to visualise improvement at epochs 1, 10, 50.
