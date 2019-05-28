function GameManager(){
    this.gameover = true;
    this.curr_score = 0;

    // game elements
    this.pipe_x_pos = [];
    this.pipe_y_height = [];
    this.nearest_pipe = Params.game_manager.NUM_OF_PIPES;

    if (Params.game_manager.PLAY_MODE === 1)
        this.generation = new Generation();

}

GameManager.prototype = {

    startGame: function() {
        
        this.curr_score = 0;
        this.pipe_x_pos = [];
        this.pipe_y_height = [];

        // human play
        if (Params.game_manager.PLAY_MODE === 0){
            this.solo_bird = new Bird();
        }
        // AI play
        else if (Params.game_manager.PLAY_MODE === 1){
            this.gameover = false;
            this.numAlive = Constant.POPULATION;
        }

        if (!this.gameover){
            // Initialize the position of pipes
            for (var i = 0; i < Params.game_manager.NUM_OF_PIPES; i++){
                this.pipe_x_pos[i] = (Params.frame_updater.WIDTH_OF_SCREEN + Params.game_manager.WIDTH_OF_PIPE) * (0.30*i + 1);
                this.pipe_y_height[i] = this._getPipeHeight();
            }
            this.pipe_x_pos[Params.game_manager.NUM_OF_PIPES] = Number.MAX_VALUE;
        }        

        this.timerGame();
        frame_updater.initFrame();
    },

    updateGame: function(){

        if (Params.game_manager.PLAY_MODE === 0){
            if (!this.gameover){
                this._movePipeX();
                this._findNearestPipe();
                this._moveBird();
            }else{
                this.solo_bird.hover();     // hover
            }
        }else if (Params.game_manager.PLAY_MODE === 1){
            if (!this.gameover){
                this._movePipeX();
                this._findNearestPipe();
                this._moveBird();
            }
        }

        this._checkGameStatus();

        // update the frame for each cycle
        frame_updater.updateFrame();        
    },

    timerGame: function(){
        var self = this;
        if (timer) {
            clearInterval(timer);
        }

        timer = setInterval(
            function(){
                self.updateGame();
            },
            Params.frame_updater.FRAME_RATE //measured in miliseconds
        )
    },

    getNearestPipeDist: function(){
        return (this.pipe_x_pos[this.nearest_pipe] - Params.game_manager.BIRD_INIT_X) / (Params.frame_updater.WIDTH_OF_SCREEN / 2);
    },

    getNearestPipeHeight: function(){
        return this.pipe_y_height[this.nearest_pipe];
    },

    _getPipeHeight: function(){
        return Math.floor(Math.random() * (Params.game_manager.POS_MAX_Y_PIPE - Params.game_manager.POS_MIN_Y_PIPE)) + Params.game_manager.POS_MIN_Y_PIPE;
    },

    _movePipeX: function(){
        for (var i = 0; i < Params.game_manager.NUM_OF_PIPES; i++){
            // moving the pipe closer to the bird

            if (Math.random() > 0.75){
                this.pipe_x_pos[i] -= Params.game_manager.BIRD_X_SPEED*1.5;
            }else{
                this.pipe_x_pos[i] -= Params.game_manager.BIRD_X_SPEED;
            }

            if (Math.random() > 0.75){
                this.pipe_y_height[i] -= 3;
            }else if (Math.random() < 0.25){
                this.pipe_y_height[i] += 3;
            }

            // update if the pipe past the screen
            if (this.pipe_x_pos[i] <= -Params.game_manager.WIDTH_OF_PIPE){
                this.pipe_x_pos[i] = (Params.frame_updater.WIDTH_OF_SCREEN + Params.game_manager.WIDTH_OF_PIPE) * 0.30 *  Params.game_manager.NUM_OF_PIPES - Params.game_manager.WIDTH_OF_PIPE;
                this.pipe_y_height[i] = this._getPipeHeight();
            }
        }

        // track scoring
        if (this.pipe_x_pos[this.nearest_pipe] < Params.game_manager.BIRD_INIT_X - Params.game_manager.WIDTH_OF_PIPE - Params.game_manager.BIRD_RADIUS)
            this.curr_score++;
    },

    _moveBird: function(){
        if (Params.game_manager.PLAY_MODE === 0){   // human play

            this.solo_bird.flap(false);
            if (this.solo_bird.isAlive){

                // update the bird score
                this.solo_bird.score = this.curr_score;

                // bird hit the platform
                if (this.solo_bird.y + Params.game_manager.BIRD_RADIUS >= Params.game_manager.PlATFORM_Y){
                    this.solo_bird.isAlive = false;
                }
                // bird hit ceiling
                else if (this.solo_bird.y <= - Params.game_manager.BIRD_RADIUS){
                    this.solo_bird.isAlive = false;
                }
                // crashed into pipes
                else if (this.pipe_x_pos[this.nearest_pipe] - Params.game_manager.BIRD_INIT_X <= Params.game_manager.BIRD_RADIUS){

                    // upper pipe
                    if (this.solo_bird.y - Params.game_manager.BIRD_RADIUS <= this.pipe_y_height[this.nearest_pipe]){
                        this.solo_bird.isAlive = false;
                    }
                    // lower pipe
                    else if (this.solo_bird.y + Params.game_manager.BIRD_RADIUS >= this.pipe_y_height[this.nearest_pipe] + Params.game_manager.GAP_PIPE){
                        this.solo_bird.isAlive = false;
                    }

                }
            }

            // prevent bird from going out of bound
            if (this.solo_bird.y + Params.game_manager.BIRD_RADIUS >= Params.game_manager.PlATFORM_Y){
                this.solo_bird.y = Params.game_manager.PlATFORM_Y + Params.game_manager.BIRD_RADIUS;
            }
        }else if (Params.game_manager.PLAY_MODE === 1){     // ai player

            this.generation.triggerFlap();
            for (var i = 0; i < Constant.POPULATION; i++){
                if (this.generation.population[i].isAlive) {
                    this.generation.population[i].score = this.curr_score;

                    if (this.generation.population[i].y + Params.game_manager.BIRD_RADIUS >= Params.game_manager.PlATFORM_Y) {
                        this.generation.population[i].isAlive = false;
                    }
                    else if (this.generation.population[i].y <= -Params.game_manager.BIRD_RADIUS) {
                        this.generation.population[i].isAlive = false;
                    }
                    else if (this.pipe_x_pos[this.nearest_pipe] - Params.game_manager.BIRD_INIT_X <= Params.game_manager.BIRD_RADIUS) {
                        // upper pipe
                        if (this.generation.population[i].y - Params.game_manager.BIRD_RADIUS <= this.pipe_y_height[this.nearest_pipe]){
                            this.generation.population[i].isAlive = false;
                        }
                        // lower pipe
                        else if (this.generation.population[i].y + Params.game_manager.BIRD_RADIUS >= this.pipe_y_height[this.nearest_pipe] + Params.game_manager.GAP_PIPE){
                            this.generation.population[i].isAlive = false;
                        }
                    }

                    // death count
                    if (!this.generation.population[i].isAlive) {
                        this.numAlive--;
                    }
                } else if (!this.gameover) {

                    // move back the dead bodies
                    this.generation.population[i].x -= Params.game_manager.BIRD_X_SPEED;
                }

                if (this.generation.population[i].y + Params.game_manager.BIRD_RADIUS >= Params.game_manager.PlATFORM_Y) {
                    this.generation.population[i].y = Params.game_manager.PlATFORM_Y + Params.game_manager.BIRD_RADIUS;
                }
            }
        }
    },

    _findNearestPipe: function(){
        // check against the boundary condition
        this.nearest_pipe = Params.game_manager.NUM_OF_PIPES;
        for(var i = 0; i < Params.game_manager.NUM_OF_PIPES; i++){
            if (this.pipe_x_pos[i] >= Params.game_manager.BIRD_INIT_X - Params.game_manager.WIDTH_OF_PIPE - Params.game_manager.BIRD_RADIUS && this.pipe_x_pos[i] < this.pipe_x_pos[this.nearest_pipe]){
                this.nearest_pipe = i;
            }
        }
    },

    _checkGameStatus: function(){

        if (Params.game_manager.PLAY_MODE === 0){   // human player
            if (!this.solo_bird.isAlive && !this.gameover){
                var self = this;
                setTimeout(function(){
                    clearInterval(timer);
                    self.startGame();
                });
                this.gameover = true;
            }
        }else if (Params.game_manager.PLAY_MODE === 1){     // ai player
            if(!this.numAlive && !this.gameover){
                var self = this;
                setTimeout(function(){
                    clearInterval(timer);
                    self.generation.getSummary();
                    self.startGame();                    
                });
                this.gameover = true;
            }
        }
    }
}