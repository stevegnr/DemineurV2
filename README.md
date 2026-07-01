# Démineur V2

## Le projet
Recréer un jeu de démineur multijoueur comme https://minesweeper-multiplayer.dk, et apporter des améliorations

## Avancée du projet
### Démineur 1 joueur
- Créer une grille ✅
- Remplir la grille avec les bombes ✅
- Remplir la grille avec les cases adjacentes (les chiffres pour indiquer le nombre de bombes) ✅
- Ouvrir une case au clic ✅
- Si la case contient une bombe, défaite ✅
- Si la case contient un chiffre, continuer ✅
- Si la case ne contient rien, ouvrir les cases adjacentes (récursivité) ✅
- Si le joueur ouvre toutes les cases sauf les bombes, victoire
- Redémarrer le jeu
- Au clic droit, ajouter un drapeau sur une case. Si on clique sur une case qui a suffisamment de drapeaux autour, ouvrir les autres cases ✅

### Démineur multijoueur
- Créer une "room" ✅
- Les joueurs peuvent rejoindre la room ✅
- Si la case contient un drapeau, continuer
- Si la case contient un chiffre, c'est à l'autre joueur de jouer
- Si la case ne contient rien, ouvrir les cases adjacentes (récursivité), et c'est à l'autre joueur de jouer
- Le premier joueur à atteindre le seuil pour vaincre, victoire
Par exemple, à deux joueurs et pour 51 drapeaux, le premier joueur atteignant 26 drapeaux ((50/2) + 1) gagne
- Demande de revanche

### Autres fonctionnalités
- Création de compte avec pseudo
- Sauvegarde des scores
- Possibilité de "marquer" une case, par exemple mettre x si le joueur sait qu'il n'y a pas de drapeau/bombe, ? s'il a un doute, !  s'il sait qu'il y a un drapeau et que ce n'est pas encore à lui de joueur, ou pour marquer une bombe et ainsi verrouiller la case (empêcher l'ouverture par mauvaise manipulation)
- Super pouvoirs : 1 fois par partie, permettre à un joueur d'utiliser une super bombe et ouvrir une zone de 5x5 cases
